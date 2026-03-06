import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebHaptics } from 'web-haptics/react';

const FLASH_TIMEOUT_MS = 1100;
const STATUS_TIMEOUT_MS = 2800;
const MOBILE_POINTER_QUERY = '(pointer: coarse)';

function canTriggerMobileHaptics(isSupported) {
  if (!isSupported) {
    return false;
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(MOBILE_POINTER_QUERY).matches;
}

export function useQuizStatusFlash({ boardMode, showingSolution, onRefocus }) {
  const [status, setStatus] = useState(null);
  const [flash, setFlash] = useState(null);
  const flashTimerRef = useRef(null);
  const statusTimerRef = useRef(null);
  const { trigger: triggerHaptic, isSupported: hapticsSupported } = useWebHaptics();

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

      if (canTriggerMobileHaptics(hapticsSupported)) {
        if (nextStatus === 'correct') {
          void triggerHaptic('success');
        } else if (nextStatus === 'wrong') {
          void triggerHaptic('error');
        }
      }

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
      hapticsSupported,
      onRefocus,
      showingSolution,
      triggerHaptic,
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
