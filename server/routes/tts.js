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

ttsRouter.post('/', async (request, response) => {
  const parsed = ttsBodySchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: 'Invalid request payload for tts.',
    });
    return;
  }

  try {
    const audioBuffer = await synthesizeVocabulary(parsed.data);
    applyAudioHeaders(response);
    response.status(200).send(audioBuffer);
  } catch (error) {
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
    const sentence = await generateExampleSentence(parsed.data);
    const audioBuffer = await synthesizeSpeech({
      text: sentence,
      language: parsed.data.language,
    });

    applyAudioHeaders(response);
    response.status(200).send(audioBuffer);
  } catch (error) {
    response.status(500).json({
      error: error.message || 'Failed to generate example sentence speech.',
    });
  }
});

export default ttsRouter;
