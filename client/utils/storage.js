import {
  ACTIVE_CLASS_KEY,
  LEGACY_CLASS_ID,
  PROGRESS_KEY,
  SETTINGS_KEY,
} from '../constants.js';

function safeParseObject(rawValue) {
  try {
    return JSON.parse(rawValue || '{}');
  } catch {
    return {};
  }
}

function scopedKey(baseKey, classId) {
  return `${baseKey}:${classId}`;
}

function loadScopedObject(baseKey, classId) {
  const scoped = safeParseObject(localStorage.getItem(scopedKey(baseKey, classId)));

  if (Object.keys(scoped).length > 0 || classId !== LEGACY_CLASS_ID) {
    return scoped;
  }

  return safeParseObject(localStorage.getItem(baseKey));
}

export function loadSettings(classId) {
  return loadScopedObject(SETTINGS_KEY, classId);
}

export function saveSettings(settings, classId) {
  localStorage.setItem(scopedKey(SETTINGS_KEY, classId), JSON.stringify(settings));
}

export function loadProgressMap(classId) {
  return loadScopedObject(PROGRESS_KEY, classId);
}

export function saveProgressMap(map, classId) {
  localStorage.setItem(scopedKey(PROGRESS_KEY, classId), JSON.stringify(map));
}

export function clearAllProgress(classId) {
  localStorage.removeItem(scopedKey(PROGRESS_KEY, classId));
  localStorage.removeItem(scopedKey(SETTINGS_KEY, classId));

  if (classId === LEGACY_CLASS_ID) {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }
}

export function loadActiveClass(validClassIds, fallbackClassId) {
  const savedClassId = localStorage.getItem(ACTIVE_CLASS_KEY);
  if (savedClassId && validClassIds.includes(savedClassId)) {
    return savedClassId;
  }
  return fallbackClassId;
}

export function saveActiveClass(classId) {
  localStorage.setItem(ACTIVE_CLASS_KEY, classId);
}
