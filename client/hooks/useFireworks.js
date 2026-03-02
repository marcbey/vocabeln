import { useCallback, useEffect, useRef, useState } from 'react';

const COLORS = ['#ff8fb1', '#6df2a4', '#3cdfff', '#ffd66d', '#b18fff'];
const BURST_LIMIT = 10;
const SPARKS_PER_BURST = 36;
const BURST_INTERVAL_MS = 260;
const SPARK_LIFETIME_MS = 1500;

function randomIndex(max) {
  return Math.floor(Math.random() * max);
}

function sparkId(index) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${crypto.randomUUID()}-${index}`;
  }
  return `${Date.now()}-${index}-${Math.random()}`;
}

function createBurstSparks() {
  const originX = Math.random() * window.innerWidth;
  const originY = (0.2 + Math.random() * 0.5) * window.innerHeight;

  return Array.from({ length: SPARKS_PER_BURST }, (_, index) => {
    const angle = (Math.PI * 2 * index) / SPARKS_PER_BURST;
    const distance = 95 + Math.random() * 95;

    return {
      id: sparkId(index),
      x: `${originX}px`,
      y: `${originY}px`,
      dx: `${Math.cos(angle) * distance}px`,
      dy: `${Math.sin(angle) * distance}px`,
      color: COLORS[randomIndex(COLORS.length)],
    };
  });
}

export function useFireworks() {
  const [bursts, setBursts] = useState([]);
  const intervalRef = useRef(null);
  const cleanupTimersRef = useRef([]);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    cleanupTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    cleanupTimersRef.current = [];
  }, []);

  const launch = useCallback(() => {
    let firedBursts = 0;
    clearTimers();

    intervalRef.current = setInterval(() => {
      firedBursts += 1;

      const sparks = createBurstSparks();
      setBursts((prev) => [...prev, ...sparks]);

      const cleanupTimerId = window.setTimeout(() => {
        setBursts((prev) => prev.slice(sparks.length));
      }, SPARK_LIFETIME_MS);
      cleanupTimersRef.current.push(cleanupTimerId);

      if (firedBursts >= BURST_LIMIT) {
        clearTimers();
      }
    }, BURST_INTERVAL_MS);
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return { bursts, launch };
}
