import { useEffect, useRef, useState } from 'react';

const SOLUTION_REVEAL_FLASH_MS = 850;

export function useSolutionRevealFlash({ showingSolution, translation }) {
  const [solutionRevealFlash, setSolutionRevealFlash] = useState(false);
  const revealTimerRef = useRef(null);

  useEffect(() => {
    if (!showingSolution) {
      return;
    }

    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    setSolutionRevealFlash(true);
    revealTimerRef.current = window.setTimeout(() => {
      setSolutionRevealFlash(false);
      revealTimerRef.current = null;
    }, SOLUTION_REVEAL_FLASH_MS);
  }, [showingSolution, translation]);

  useEffect(
    () => () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    },
    []
  );

  return solutionRevealFlash;
}
