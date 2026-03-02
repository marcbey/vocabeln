import { useCallback, useEffect, useRef, useState } from 'react';

function toUserMessage(responseStatus) {
  if (responseStatus >= 500) {
    return 'Sprachausgabe ist gerade nicht verfügbar.';
  }

  return 'Sprachausgabe konnte nicht geladen werden.';
}

export function useSpeechPlayback() {
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const hintTimerRef = useRef(null);
  const playRequestRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaybackType, setActivePlaybackType] = useState(null);
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
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsPlaying(false);
    setActivePlaybackType(null);
  }, []);

  const playFromEndpoint = useCallback(
    async ({ text, language, endpoint, playbackType }) => {
      if (!text) {
        return;
      }

      const requestId = playRequestRef.current + 1;
      playRequestRef.current = requestId;
      cleanupAudio();
      setHint('');
      setActivePlaybackType(playbackType);
      setIsLoading(true);

      try {
        const response = await fetch(endpoint, {
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
          if (playRequestRef.current !== requestId) {
            return;
          }
          setIsPlaying(false);
          setActivePlaybackType(null);
        };
        audio.onerror = () => {
          if (playRequestRef.current !== requestId) {
            return;
          }
          setIsPlaying(false);
          setActivePlaybackType(null);
          setHint('Audio konnte nicht abgespielt werden.');
        };

        if (playRequestRef.current !== requestId) {
          return;
        }

        setIsLoading(false);
        setIsPlaying(true);
        await audio.play();
      } catch (fetchError) {
        if (playRequestRef.current !== requestId) {
          return;
        }
        setIsLoading(false);
        setIsPlaying(false);
        setActivePlaybackType(null);
        setHint(fetchError.message || 'Sprachausgabe fehlgeschlagen.');
      }
    },
    [cleanupAudio, setHint]
  );

  const playVocabulary = useCallback(
    async ({ text, language }) => {
      await playFromEndpoint({
        text,
        language,
        endpoint: '/api/tts',
        playbackType: 'vocabulary',
      });
    },
    [playFromEndpoint]
  );

  const playExampleSentence = useCallback(
    async ({ text, language }) => {
      await playFromEndpoint({
        text,
        language,
        endpoint: '/api/tts/example',
        playbackType: 'example',
      });
    },
    [playFromEndpoint]
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
    activePlaybackType,
    error,
    playVocabulary,
    playExampleSentence,
  };
}
