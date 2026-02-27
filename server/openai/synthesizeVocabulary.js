import { getOpenAIClient } from './client.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const CACHE_MAX_ITEMS = 200;
const audioCache = new Map();

const VOICE_BY_LANGUAGE = {
  de: 'cedar',
  en: 'marin',
};

const INSTRUCTIONS_BY_LANGUAGE = {
  de: 'Speak naturally with a clear German accent. Pronounce the input exactly as written.',
  en: 'Speak naturally with a clear English accent. Pronounce the input exactly as written.',
};

function cacheKey(text, language) {
  return `${language}:${text.trim().toLowerCase()}`;
}

function pruneCache() {
  const now = Date.now();

  for (const [key, value] of audioCache) {
    if (value.expiresAt <= now) {
      audioCache.delete(key);
    }
  }

  while (audioCache.size > CACHE_MAX_ITEMS) {
    const oldestKey = audioCache.keys().next().value;
    audioCache.delete(oldestKey);
  }
}

export async function synthesizeVocabulary({ text, language }) {
  const cleanText = text.trim();
  const key = cacheKey(cleanText, language);
  const now = Date.now();
  const cachedEntry = audioCache.get(key);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.audioBuffer;
  }

  if (cachedEntry) {
    audioCache.delete(key);
  }

  const openai = getOpenAIClient();
  const speechResponse = await openai.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
    voice: VOICE_BY_LANGUAGE[language] || 'cedar',
    input: cleanText,
    instructions:
      INSTRUCTIONS_BY_LANGUAGE[language] || INSTRUCTIONS_BY_LANGUAGE.en,
    response_format: 'mp3',
  });

  const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
  audioCache.set(key, {
    audioBuffer,
    expiresAt: now + CACHE_TTL_MS,
  });
  pruneCache();

  return audioBuffer;
}
