import { getOpenAIClient } from './client.js';
import { hashCacheParts, ttsDiskCache } from '../cache/ttsDiskCache.js';

const MEMORY_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MEMORY_CACHE_MAX_ITEMS = 200;
const DISK_CACHE_TTL_MS_BY_KIND = {
  vocabulary_audio: 1000 * 60 * 60 * 24 * 30,
  example_audio: 1000 * 60 * 60 * 24 * 7,
};
const TTS_INSTRUCTIONS_VERSION = 'v1';
const audioCache = new Map();
const inFlightAudioRequests = new Map();

const VOICE_BY_LANGUAGE = {
  de: 'cedar',
  en: 'marin',
};

const INSTRUCTIONS_BY_LANGUAGE = {
  de: 'Speak naturally with a clear German accent. Pronounce the input exactly as written.',
  en: 'Speak naturally with a clear English accent. Pronounce the input exactly as written.',
};

export function sanitizeVocabularyText(text) {
  const withoutParentheses = text.replace(/\s*\([^)]*\)/g, ' ');
  const normalized = withoutParentheses.replace(/\s+/g, ' ').trim();

  if (normalized) {
    return normalized;
  }

  // Fallback for edge cases where the whole value was parenthesized.
  return text.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeSpeechText(text, stripParenthetical) {
  const normalized = text.trim();
  if (!stripParenthetical) {
    return normalized;
  }

  return sanitizeVocabularyText(normalized);
}

function buildAudioCacheKey({
  cacheKind,
  language,
  normalizedText,
  voice,
  model,
}) {
  return hashCacheParts([
    'tts-audio',
    cacheKind,
    language,
    normalizedText,
    voice,
    model,
    TTS_INSTRUCTIONS_VERSION,
  ]);
}

function pruneCache() {
  const now = Date.now();

  for (const [key, value] of audioCache) {
    if (value.expiresAt <= now) {
      audioCache.delete(key);
    }
  }

  while (audioCache.size > MEMORY_CACHE_MAX_ITEMS) {
    const oldestKey = audioCache.keys().next().value;
    audioCache.delete(oldestKey);
  }
}

export async function synthesizeVocabulary({ text, language, telemetry = null }) {
  return synthesizeSpeech({
    text,
    language,
    stripParenthetical: true,
    cacheKind: 'vocabulary_audio',
    telemetry,
  });
}

export async function synthesizeSpeech({
  text,
  language,
  stripParenthetical = false,
  cacheKind = 'vocabulary_audio',
  telemetry = null,
}) {
  const cleanText = normalizeSpeechText(text, stripParenthetical);
  if (!cleanText) {
    throw new Error('Text for speech output is empty.');
  }

  const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
  const voice = VOICE_BY_LANGUAGE[language] || 'cedar';
  const instructions =
    INSTRUCTIONS_BY_LANGUAGE[language] || INSTRUCTIONS_BY_LANGUAGE.en;
  const key = buildAudioCacheKey({
    cacheKind,
    language,
    normalizedText: cleanText,
    voice,
    model,
  });
  const now = Date.now();
  const cachedEntry = audioCache.get(key);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    if (telemetry && typeof telemetry === 'object') {
      telemetry.audioCache = 'memory';
    }
    return cachedEntry.audioBuffer;
  }

  if (cachedEntry) {
    audioCache.delete(key);
  }

  const inFlight = inFlightAudioRequests.get(key);
  if (inFlight) {
    return inFlight;
  }

  const loadAudioPromise = (async () => {
    const diskCachedAudio = await ttsDiskCache.getAudio(key);
    if (diskCachedAudio) {
      audioCache.set(key, {
        audioBuffer: diskCachedAudio,
        expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
      });
      pruneCache();
      if (telemetry && typeof telemetry === 'object') {
        telemetry.audioCache = 'disk';
      }
      return diskCachedAudio;
    }

    const openai = getOpenAIClient();
    const speechResponse = await openai.audio.speech.create({
      model,
      voice,
      input: cleanText,
      instructions,
      response_format: 'mp3',
    });

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    audioCache.set(key, {
      audioBuffer,
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
    });
    pruneCache();

    const diskTtlMs =
      DISK_CACHE_TTL_MS_BY_KIND[cacheKind] || DISK_CACHE_TTL_MS_BY_KIND.example_audio;
    await ttsDiskCache.setAudio({
      cacheKey: key,
      audioBuffer,
      ttlMs: diskTtlMs,
      language,
      kind: cacheKind,
    });
    if (telemetry && typeof telemetry === 'object') {
      telemetry.audioCache = 'openai';
    }

    return audioBuffer;
  })().finally(() => {
    inFlightAudioRequests.delete(key);
  });

  inFlightAudioRequests.set(key, loadAudioPromise);
  return loadAudioPromise;
}
