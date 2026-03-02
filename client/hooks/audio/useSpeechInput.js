import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_RECORDING_MS = 300;
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return '';
  }

  return MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

function extensionForMime(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

export function useSpeechInput({ language, onAnswerReady }) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const hintTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setHint = useCallback((message, ttlMs = 2200) => {
    setError(message);

    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }

    if (!message) {
      return;
    }

    hintTimerRef.current = window.setTimeout(() => {
      setError('');
      hintTimerRef.current = null;
    }, ttlMs);
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const submitRecording = useCallback(
    async (blob, mimeType) => {
      const formData = new FormData();
      formData.append('audio', blob, `recording.${extensionForMime(mimeType)}`);
      formData.append('language', language);

      const response = await fetch('/api/stt/check', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => ({ error: 'Spracherkennung ist gerade nicht verfügbar.' }));

        if (response.status === 400) {
          throw new Error('Audio konnte nicht ausgewertet werden.');
        }

        throw new Error(payload.error || 'Spracherkennung ist gerade nicht verfügbar.');
      }

      const payload = await response.json();
      const answer = typeof payload.answer === 'string' ? payload.answer.trim() : '';

      if (!answer) {
        setHint('Keine Sprache erkannt.');
        return;
      }

      setHint('');
      onAnswerReady(answer);
    },
    [language, onAnswerReady, setHint]
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }

    setIsRecording(false);
    setIsSubmitting(true);
    recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isSubmitting) {
      return;
    }

    if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      setHint('Spracheingabe auf diesem Gerät nicht verfügbar.');
      return;
    }

    try {
      setHint('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const elapsedMs = Date.now() - startedAtRef.current;
        const chunks = chunksRef.current;
        const recorderMimeType = recorder.mimeType || mimeType || 'audio/webm';

        cleanupStream();
        recorderRef.current = null;
        chunksRef.current = [];

        if (elapsedMs < MIN_RECORDING_MS) {
          setIsSubmitting(false);
          setHint('Aufnahme zu kurz.');
          return;
        }

        try {
          const recording = new Blob(chunks, { type: recorderMimeType });
          await submitRecording(recording, recorderMimeType);
        } catch (submitError) {
          setHint(submitError.message || 'Spracherkennung fehlgeschlagen.');
        } finally {
          setIsSubmitting(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      cleanupStream();
      setHint('Mikrofonzugriff wurde blockiert.');
    }
  }, [cleanupStream, isRecording, isSubmitting, setHint, submitRecording]);

  useEffect(
    () => () => {
      try {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      } catch {
        // no-op
      }
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
      cleanupStream();
    },
    [cleanupStream]
  );

  return {
    isRecording,
    isSubmitting,
    error,
    startRecording,
    stopRecording,
  };
}
