import { useCallback, useEffect, useRef, useState } from 'react';
import { haptic } from 'ios-haptics';

const FLASH_TIMEOUT_MS = 1100;
const STATUS_TIMEOUT_MS = 2800;

function triggerResultHaptic(status) {
  if (status === 'correct') {
    haptic.confirm();
  } else if (status === 'wrong') {
    haptic.error();
  }
}

export function useQuizStatusFlash({ boardMode, showingSolution, onRefocus }) {
  const [status, setStatus] = useState(null);
  const [flash, setFlash] = useState(null);
  const flashTimerRef = useRef(null);
  const statusTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }

    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const clearStatusFlash = useCallback(() => {
    clearTimers();
    setStatus(null);
    setFlash(null);
  }, [clearTimers]);

  const clearStatusOnly = useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    setStatus(null);
  }, []);

  const setStatusFlash = useCallback(
    (nextStatus) => {
      if (!nextStatus) {
        clearStatusFlash();
        return;
      }

      clearTimers();
      setStatus(nextStatus);
      setFlash(nextStatus === 'correct' ? 'flash-correct' : 'flash-wrong');
      triggerResultHaptic(nextStatus);

      flashTimerRef.current = window.setTimeout(() => {
        setFlash(null);
      }, FLASH_TIMEOUT_MS);

      statusTimerRef.current = window.setTimeout(() => {
        setStatus(null);
      }, STATUS_TIMEOUT_MS);

      if (!boardMode && !showingSolution) {
        onRefocus?.();
      }
    },
    [
      boardMode,
      clearStatusFlash,
      clearTimers,
      onRefocus,
      showingSolution,
    ]
  );

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    status,
    flash,
    setStatusFlash,
    clearStatusFlash,
    clearStatusOnly,
  };
}
