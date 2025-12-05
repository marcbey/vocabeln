import { PROGRESS_KEY, SETTINGS_KEY } from '../constants.js';

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadProgressMap() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveProgressMap(map) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

export function clearAllProgress() {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
