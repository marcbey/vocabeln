import { useEffect, useState } from 'react';
import { loadActiveClass, saveActiveClass } from '../utils/storage.js';

export function useActiveClassId({ allowedClassIds, defaultClassId }) {
  const [activeClassId, setActiveClassId] = useState(() =>
    loadActiveClass(allowedClassIds, defaultClassId)
  );

  useEffect(() => {
    saveActiveClass(activeClassId);
  }, [activeClassId]);

  return [activeClassId, setActiveClassId];
}
