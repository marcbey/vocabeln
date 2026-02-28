import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTtsDiskCache } from './ttsDiskCache.js';

const activeCaches = [];
const tempDirs = [];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createTempCache(options = {}) {
  const cacheRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tts-cache-test-'));
  tempDirs.push(cacheRoot);

  const cache = createTtsDiskCache({
    cacheRoot,
    cleanupIntervalMs: 0,
    ...options,
  });
  activeCaches.push(cache);

  return { cacheRoot, cache };
}

afterEach(async () => {
  for (const cache of activeCaches.splice(0)) {
    cache.stopCleanupTimer();
    await cache.queueWrite(async () => {});
  }

  for (const dir of tempDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe('ttsDiskCache', () => {
  it('stores and reloads audio entries across cache instances', async () => {
    const { cache, cacheRoot } = await createTempCache();
    const audioBuffer = Buffer.from('hello-audio');

    const wasStored = await cache.setAudio({
      cacheKey: 'audio-key',
      audioBuffer,
      ttlMs: 60_000,
      language: 'de',
      kind: 'vocabulary_audio',
    });

    expect(wasStored).toBe(true);
    await expect(cache.getAudio('audio-key')).resolves.toEqual(audioBuffer);

    const reloadedCache = createTtsDiskCache({
      cacheRoot,
      cleanupIntervalMs: 0,
    });
    activeCaches.push(reloadedCache);

    await expect(reloadedCache.getAudio('audio-key')).resolves.toEqual(
      audioBuffer
    );
  });

  it('expires sentence entries by ttl', async () => {
    const { cache } = await createTempCache();

    await cache.setSentence({
      cacheKey: 'sentence-key',
      sentence: 'Ich gehe heute zur Schule.',
      ttlMs: 5,
      language: 'de',
    });

    await expect(cache.getSentence('sentence-key')).resolves.toBe(
      'Ich gehe heute zur Schule.'
    );

    await wait(20);
    await expect(cache.getSentence('sentence-key')).resolves.toBe(null);
  });

  it('recovers from corrupted index file', async () => {
    const cacheRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tts-cache-test-'));
    tempDirs.push(cacheRoot);
    await fs.mkdir(path.join(cacheRoot, 'meta'), { recursive: true });
    await fs.writeFile(path.join(cacheRoot, 'meta', 'index.json'), '{oops');

    const cache = createTtsDiskCache({
      cacheRoot,
      cleanupIntervalMs: 0,
    });
    activeCaches.push(cache);

    await expect(cache.getSentence('missing')).resolves.toBe(null);

    await cache.setSentence({
      cacheKey: 'sentence-key',
      sentence: 'Today I use the word school.',
      ttlMs: 60_000,
      language: 'en',
    });

    await expect(cache.getSentence('sentence-key')).resolves.toBe(
      'Today I use the word school.'
    );
  });

  it('skips audio cache writes after reaching max cache size', async () => {
    const { cache } = await createTempCache({ maxCacheBytes: 3 });

    await expect(
      cache.setAudio({
        cacheKey: 'one',
        audioBuffer: Buffer.from([1, 2]),
        ttlMs: 60_000,
        language: 'de',
        kind: 'vocabulary_audio',
      })
    ).resolves.toBe(true);

    await expect(
      cache.setAudio({
        cacheKey: 'two',
        audioBuffer: Buffer.from([1, 2]),
        ttlMs: 60_000,
        language: 'de',
        kind: 'vocabulary_audio',
      })
    ).resolves.toBe(false);

    await expect(cache.getAudio('one')).resolves.toEqual(Buffer.from([1, 2]));
    await expect(cache.getAudio('two')).resolves.toBe(null);
  });
});
