import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CACHE_ROOT =
  typeof process.env.TTS_CACHE_DIR === 'string' &&
  process.env.TTS_CACHE_DIR.trim()
    ? process.env.TTS_CACHE_DIR.trim()
    : '/tmp/tts-cache';
const DEFAULT_CLEANUP_INTERVAL_MS = 1000 * 60 * 60 * 6;
const DEFAULT_MAX_CACHE_BYTES = 950 * 1024 * 1024;
const DEFAULT_TOUCH_DEBOUNCE_MS = 1000 * 60;

function createEmptyIndex() {
  return {
    audio: {},
    sentences: {},
  };
}

function toIsoTimestamp(nowMs = Date.now()) {
  return new Date(nowMs).toISOString();
}

function parseTimestamp(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeIndexShape(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return createEmptyIndex();
  }

  const audio =
    parsed.audio && typeof parsed.audio === 'object' ? parsed.audio : {};
  const sentences =
    parsed.sentences && typeof parsed.sentences === 'object'
      ? parsed.sentences
      : {};

  return { audio, sentences };
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function hashCacheParts(parts) {
  return crypto
    .createHash('sha256')
    .update(parts.map((part) => String(part ?? '')).join('\u241F'))
    .digest('hex');
}

class TtsDiskCache {
  constructor({
    cacheRoot = DEFAULT_CACHE_ROOT,
    cleanupIntervalMs = DEFAULT_CLEANUP_INTERVAL_MS,
    maxCacheBytes = DEFAULT_MAX_CACHE_BYTES,
    touchDebounceMs = DEFAULT_TOUCH_DEBOUNCE_MS,
  } = {}) {
    this.cacheRoot = cacheRoot;
    this.audioDir = path.join(cacheRoot, 'audio');
    this.metaDir = path.join(cacheRoot, 'meta');
    this.indexPath = path.join(this.metaDir, 'index.json');
    this.cleanupIntervalMs = cleanupIntervalMs;
    this.maxCacheBytes = maxCacheBytes;
    this.touchDebounceMs = touchDebounceMs;

    this.index = createEmptyIndex();
    this.readyPromise = null;
    this.writeQueue = Promise.resolve();
    this.cleanupTimer = null;
  }

  async ensureReady() {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = (async () => {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.metaDir, { recursive: true });
      this.index = await this.loadIndex();
      await this.queueWrite(async () => {
        const changed = await this.cleanupExpiredLocked(Date.now());
        if (changed) {
          await this.persistIndex();
        }
      });
      this.startCleanupTimer();
    })();

    return this.readyPromise;
  }

  async loadIndex() {
    try {
      const raw = await fs.readFile(this.indexPath, 'utf8');
      const parsed = JSON.parse(raw);
      return normalizeIndexShape(parsed);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return createEmptyIndex();
      }

      return createEmptyIndex();
    }
  }

  async persistIndex() {
    const tempPath = path.join(
      this.metaDir,
      `index.${process.pid}.${Date.now()}.tmp`
    );

    try {
      await fs.writeFile(tempPath, JSON.stringify(this.index), 'utf8');
      await fs.rename(tempPath, this.indexPath);
    } finally {
      await safeUnlink(tempPath);
    }
  }

  queueWrite(task) {
    this.writeQueue = this.writeQueue.then(task, task);
    return this.writeQueue;
  }

  startCleanupTimer() {
    if (this.cleanupTimer || this.cleanupIntervalMs <= 0) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpired().catch(() => {});
    }, this.cleanupIntervalMs);

    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  stopCleanupTimer() {
    if (!this.cleanupTimer) {
      return;
    }

    clearInterval(this.cleanupTimer);
    this.cleanupTimer = null;
  }

  getAudioPath(fileName) {
    return path.join(this.audioDir, fileName);
  }

  getTotalAudioBytes() {
    return Object.values(this.index.audio).reduce((sum, entry) => {
      const sizeBytes = Number(entry?.sizeBytes) || 0;
      return sum + sizeBytes;
    }, 0);
  }

  async cleanupExpiredLocked(nowMs) {
    let changed = false;

    for (const [key, entry] of Object.entries(this.index.audio)) {
      const expiresAtMs = parseTimestamp(entry?.expiresAt);
      if (!expiresAtMs || expiresAtMs > nowMs) {
        continue;
      }

      changed = true;
      delete this.index.audio[key];
      const fileName = entry?.fileName || `${key}.mp3`;
      await safeUnlink(this.getAudioPath(fileName));
    }

    for (const [key, entry] of Object.entries(this.index.sentences)) {
      const expiresAtMs = parseTimestamp(entry?.expiresAt);
      if (!expiresAtMs || expiresAtMs > nowMs) {
        continue;
      }

      changed = true;
      delete this.index.sentences[key];
    }

    return changed;
  }

  async cleanupExpired() {
    await this.ensureReady();
    await this.queueWrite(async () => {
      const changed = await this.cleanupExpiredLocked(Date.now());
      if (changed) {
        await this.persistIndex();
      }
    });
  }

  scheduleTouch({
    store,
    cacheKey,
    timestampField = 'lastAccessAt',
    nowMs = Date.now(),
  }) {
    const entry = this.index[store]?.[cacheKey];
    if (!entry) {
      return;
    }

    const lastAccessMs = parseTimestamp(entry[timestampField] || entry.createdAt);
    if (nowMs - lastAccessMs < this.touchDebounceMs) {
      return;
    }

    void this.queueWrite(async () => {
      const latestEntry = this.index[store]?.[cacheKey];
      if (!latestEntry) {
        return;
      }

      latestEntry[timestampField] = toIsoTimestamp();
      await this.persistIndex();
    }).catch(() => {});
  }

  async getAudio(cacheKey) {
    await this.ensureReady();

    const entry = this.index.audio[cacheKey];
    if (!entry) {
      return null;
    }

    const nowMs = Date.now();
    if (parseTimestamp(entry.expiresAt) <= nowMs) {
      await this.queueWrite(async () => {
        const latestEntry = this.index.audio[cacheKey];
        if (!latestEntry || parseTimestamp(latestEntry.expiresAt) > Date.now()) {
          return;
        }

        delete this.index.audio[cacheKey];
        const fileName = latestEntry.fileName || `${cacheKey}.mp3`;
        await safeUnlink(this.getAudioPath(fileName));
        await this.persistIndex();
      });
      return null;
    }

    const fileName = entry.fileName || `${cacheKey}.mp3`;
    try {
      const audioBuffer = await fs.readFile(this.getAudioPath(fileName));
      this.scheduleTouch({ store: 'audio', cacheKey, nowMs });
      return audioBuffer;
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }

      await this.queueWrite(async () => {
        if (!this.index.audio[cacheKey]) {
          return;
        }

        delete this.index.audio[cacheKey];
        await this.persistIndex();
      });
      return null;
    }
  }

  async setAudio({ cacheKey, audioBuffer, ttlMs, language, kind }) {
    await this.ensureReady();

    const nowMs = Date.now();
    const createdAt = toIsoTimestamp(nowMs);
    const expiresAt = toIsoTimestamp(nowMs + Math.max(1, ttlMs));
    const fileName = `${cacheKey}.mp3`;
    const sizeBytes = audioBuffer.byteLength;

    return this.queueWrite(async () => {
      const changedByCleanup = await this.cleanupExpiredLocked(Date.now());

      const existingEntry = this.index.audio[cacheKey];
      const existingBytes = Number(existingEntry?.sizeBytes) || 0;
      const projectedBytes =
        this.getTotalAudioBytes() - existingBytes + sizeBytes;

      if (projectedBytes > this.maxCacheBytes) {
        if (changedByCleanup) {
          await this.persistIndex();
        }
        return false;
      }

      const targetPath = this.getAudioPath(fileName);
      const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;

      try {
        await fs.writeFile(tempPath, audioBuffer);
        await fs.rename(tempPath, targetPath);
      } finally {
        await safeUnlink(tempPath);
      }

      this.index.audio[cacheKey] = {
        fileName,
        createdAt,
        lastAccessAt: createdAt,
        expiresAt,
        sizeBytes,
        language,
        kind,
      };

      await this.persistIndex();
      return true;
    });
  }

  async getSentence(cacheKey) {
    await this.ensureReady();

    const entry = this.index.sentences[cacheKey];
    if (!entry) {
      return null;
    }

    const nowMs = Date.now();
    if (parseTimestamp(entry.expiresAt) <= nowMs) {
      await this.queueWrite(async () => {
        const latestEntry = this.index.sentences[cacheKey];
        if (!latestEntry || parseTimestamp(latestEntry.expiresAt) > Date.now()) {
          return;
        }

        delete this.index.sentences[cacheKey];
        await this.persistIndex();
      });
      return null;
    }

    this.scheduleTouch({ store: 'sentences', cacheKey, nowMs });
    return typeof entry.sentence === 'string' ? entry.sentence : null;
  }

  async setSentence({ cacheKey, sentence, ttlMs, language }) {
    await this.ensureReady();

    const nowMs = Date.now();
    const createdAt = toIsoTimestamp(nowMs);
    const expiresAt = toIsoTimestamp(nowMs + Math.max(1, ttlMs));

    return this.queueWrite(async () => {
      await this.cleanupExpiredLocked(Date.now());

      this.index.sentences[cacheKey] = {
        sentence,
        createdAt,
        lastAccessAt: createdAt,
        expiresAt,
        language,
      };

      await this.persistIndex();
      return true;
    });
  }
}

export function createTtsDiskCache(options) {
  return new TtsDiskCache(options);
}

export const ttsDiskCache = createTtsDiskCache();
