import { Router } from 'express';
import { z } from 'zod';
import { generateExampleSentence } from '../openai/generateExampleSentence.js';
import {
  synthesizeSpeech,
  synthesizeVocabulary,
} from '../openai/synthesizeVocabulary.js';

const ttsBodySchema = z.object({
  text: z.string().trim().min(1).max(120),
  language: z.enum(['de', 'en']),
});

const ttsRouter = Router();

function applyAudioHeaders(response) {
  response.setHeader('Content-Type', 'audio/mpeg');
  response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
}

function toHitOrMiss(cacheSource) {
  return cacheSource === 'openai' ? 'MISS' : 'HIT';
}

function applyCacheHeaders(response, { audioCache, sentenceCache }) {
  if (audioCache) {
    response.setHeader('X-TTS-Audio-Cache', audioCache);
  }

  if (sentenceCache) {
    response.setHeader('X-TTS-Sentence-Cache', sentenceCache);
  }

  const sources = [audioCache, sentenceCache].filter(Boolean);
  if (sources.length === 0) {
    response.setHeader('X-Cache', 'MISS');
    return;
  }

  const hasMiss = sources.some((source) => source === 'openai');
  response.setHeader('X-Cache', hasMiss ? 'MISS' : 'HIT');
}

function logSuccess({
  route,
  language,
  textLength,
  audioCache,
  sentenceCache = null,
}) {
  console.info('[tts]', {
    route,
    language,
    textLength,
    audioCache,
    audioHit: toHitOrMiss(audioCache),
    sentenceCache,
    sentenceHit: sentenceCache ? toHitOrMiss(sentenceCache) : null,
  });
}

ttsRouter.post('/', async (request, response) => {
  const parsed = ttsBodySchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: 'Invalid request payload for tts.',
    });
    return;
  }

  try {
    const telemetry = {};
    const audioBuffer = await synthesizeVocabulary({
      ...parsed.data,
      telemetry,
    });
    applyAudioHeaders(response);
    applyCacheHeaders(response, telemetry);
    logSuccess({
      route: '/api/tts',
      language: parsed.data.language,
      textLength: parsed.data.text.length,
      audioCache: telemetry.audioCache || 'openai',
    });
    response.status(200).send(audioBuffer);
  } catch (error) {
    console.error('[tts:error]', {
      route: '/api/tts',
      language: parsed.data.language,
      message: error?.message || 'unknown error',
    });
    response.status(500).json({
      error: error.message || 'Failed to generate speech.',
    });
  }
});

ttsRouter.post('/example', async (request, response) => {
  const parsed = ttsBodySchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: 'Invalid request payload for example tts.',
    });
    return;
  }

  try {
    const telemetry = {};
    const sentence = await generateExampleSentence({
      ...parsed.data,
      telemetry,
    });
    const audioBuffer = await synthesizeSpeech({
      text: sentence,
      language: parsed.data.language,
      cacheKind: 'example_audio',
      telemetry,
    });

    applyAudioHeaders(response);
    applyCacheHeaders(response, telemetry);
    logSuccess({
      route: '/api/tts/example',
      language: parsed.data.language,
      textLength: parsed.data.text.length,
      audioCache: telemetry.audioCache || 'openai',
      sentenceCache: telemetry.sentenceCache || 'openai',
    });
    response.status(200).send(audioBuffer);
  } catch (error) {
    console.error('[tts:error]', {
      route: '/api/tts/example',
      language: parsed.data.language,
      message: error?.message || 'unknown error',
    });
    response.status(500).json({
      error: error.message || 'Failed to generate example sentence speech.',
    });
  }
});

export default ttsRouter;
