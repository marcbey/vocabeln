import { useCallback, useEffect, useRef, useState } from 'react';

function toUserMessage(responseStatus) {
  if (responseStatus >= 500) {
    return 'Sprachausgabe ist gerade nicht verfuegbar.';
  }

  return 'Sprachausgabe konnte nicht geladen werden.';
}

export function useSpeechPlayback() {
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const hintTimerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsPlaying(false);
  }, []);

  const playVocabulary = useCallback(
    async ({ text, language }) => {
      if (!text) {
        return;
      }

      cleanupAudio();
      setHint('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error(toUserMessage(response.status));
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setHint('Audio konnte nicht abgespielt werden.');
        };

        setIsLoading(false);
        setIsPlaying(true);
        await audio.play();
      } catch (fetchError) {
        setIsLoading(false);
        setIsPlaying(false);
        setHint(fetchError.message || 'Sprachausgabe fehlgeschlagen.');
      }
    },
    [cleanupAudio, setHint]
  );

  useEffect(
    () => () => {
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
      cleanupAudio();
    },
    [cleanupAudio]
  );

  return {
    isLoading,
    isPlaying,
    error,
    playVocabulary,
  };
}
