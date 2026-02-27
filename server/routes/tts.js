import { Router } from 'express';
import { z } from 'zod';
import { synthesizeVocabulary } from '../openai/synthesizeVocabulary.js';

const ttsBodySchema = z.object({
  text: z.string().trim().min(1).max(120),
  language: z.enum(['de', 'en']),
});

const ttsRouter = Router();

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
    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    response.status(200).send(audioBuffer);
  } catch (error) {
    response.status(500).json({
      error: error.message || 'Failed to generate speech.',
    });
  }
});

export default ttsRouter;
