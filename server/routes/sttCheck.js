import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { transcribeAndNormalizeAnswer } from '../openai/transcribeAndNormalizeAnswer.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const bodySchema = z.object({
  language: z.enum(['de', 'en']),
});

const sttCheckRouter = Router();

sttCheckRouter.post('/', upload.single('audio'), async (request, response) => {
  if (!request.file?.buffer?.length) {
    response.status(400).json({
      error: 'Missing audio payload.',
    });
    return;
  }

  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: 'Invalid request payload for stt.',
    });
    return;
  }

  try {
    const result = await transcribeAndNormalizeAnswer({
      audioBuffer: request.file.buffer,
      mimeType: request.file.mimetype || 'audio/webm',
      language: parsed.data.language,
    });

    response.status(200).json(result);
  } catch (error) {
    const upstreamStatus = Number(error?.status || 0);
    const statusCode =
      upstreamStatus >= 400 && upstreamStatus < 500 ? 400 : 500;

    response.status(statusCode).json({
      error:
        statusCode === 400
          ? 'Audiodatei ungueltig oder nicht unterstuetzt.'
          : 'Failed to transcribe audio.',
    });
  }
});

export default sttCheckRouter;
