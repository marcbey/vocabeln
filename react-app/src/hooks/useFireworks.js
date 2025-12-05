import { useCallback, useEffect, useRef, useState } from 'react';
import { rand } from '../utils/answers.js';

const COLORS = ['#ff8fb1', '#6df2a4', '#3cdfff', '#ffd66d', '#b18fff'];

export function useFireworks() {
  const [bursts, setBursts] = useState([]);
  const timerRef = useRef(null);

  const launch = useCallback(() => {
    let burstsCount = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      burstsCount += 1;
      const count = 25;
      const originX = Math.random() * window.innerWidth;
      const originY = (0.2 + Math.random() * 0.5) * window.innerHeight;
      const newSparks = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const distance = 80 + Math.random() * 70;
        newSparks.push({
          id: `${Date.now()}-${bursts.length}-${i}-${Math.random()}`,
          x: `${originX}px`,
          y: `${originY}px`,
          dx: `${Math.cos(angle) * distance}px`,
          dy: `${Math.sin(angle) * distance}px`,
          color: COLORS[rand(COLORS.length)],
        });
      }
      setBursts((prev) => [...prev, ...newSparks]);
      setTimeout(() => setBursts((prev) => prev.slice(newSparks.length)), 900);
      if (burstsCount > 5) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 350);
  }, [bursts.length]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { bursts, launch };
}
