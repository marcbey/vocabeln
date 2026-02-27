import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import sttCheckRouter from './routes/sttCheck.js';
import ttsRouter from './routes/tts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

const app = express();

app.use(express.json({ limit: '1mb' }));

const audioLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/health', healthRouter);
app.use('/api/tts', audioLimiter, ttsRouter);
app.use('/api/stt/check', audioLimiter, sttCheckRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (request, response) => {
    response.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = Number(process.env.PORT || process.env.API_PORT || 8787);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
