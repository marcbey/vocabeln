import { toFile } from 'openai';
import { getOpenAIClient } from './client.js';

function normalizeTranscript(value) {
  return value
    .replace(/^[\s"'`“”„‚’]+/, '')
    .replace(/[\s"'`“”„‚’]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fileExtensionForMime(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

export async function transcribeAndNormalizeAnswer({
  audioBuffer,
  mimeType,
  language,
}) {
  const openai = getOpenAIClient();
  const audioFile = await toFile(
    audioBuffer,
    `answer.${fileExtensionForMime(mimeType)}`,
    {
      type: mimeType,
    }
  );

  const transcription = await openai.audio.transcriptions.create({
    model: process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe',
    file: audioFile,
    language,
  });

  const transcript = typeof transcription.text === 'string' ? transcription.text : '';
  return {
    transcript: transcript.trim(),
    answer: normalizeTranscript(transcript),
  };
}
