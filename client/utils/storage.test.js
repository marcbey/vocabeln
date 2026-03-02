import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllProgress,
  loadActiveClass,
  loadProgressMap,
  loadSettings,
  saveActiveClass,
  saveProgressMap,
  saveSettings,
} from './storage.js';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores settings and progress per class namespace', () => {
    saveSettings({ direction: 'mixed' }, 'class5');
    saveProgressMap({ p1: { asked: 2 } }, 'class5');
    saveSettings({ direction: 'irregular' }, 'class6');
    saveProgressMap({ p6: { asked: 1 } }, 'class6');

    expect(loadSettings('class5')).toEqual({ direction: 'mixed' });
    expect(loadProgressMap('class5')).toEqual({ p1: { asked: 2 } });
    expect(loadSettings('class6')).toEqual({ direction: 'irregular' });
    expect(loadProgressMap('class6')).toEqual({ p6: { asked: 1 } });
  });

  it('falls back to legacy keys for class5 only', () => {
    localStorage.setItem('settings', JSON.stringify({ direction: 'de-en' }));
    localStorage.setItem('progress', JSON.stringify({ legacyPage: { asked: 4 } }));

    expect(loadSettings('class5')).toEqual({ direction: 'de-en' });
    expect(loadProgressMap('class5')).toEqual({ legacyPage: { asked: 4 } });
    expect(loadSettings('class6')).toEqual({});
    expect(loadProgressMap('class6')).toEqual({});
  });

  it('clears progress for the selected class only', () => {
    saveSettings({ direction: 'mixed' }, 'class5');
    saveProgressMap({ p5: { asked: 1 } }, 'class5');
    saveSettings({ direction: 'mixed' }, 'class6');
    saveProgressMap({ p6: { asked: 2 } }, 'class6');

    clearAllProgress('class6');

    expect(loadSettings('class5')).toEqual({ direction: 'mixed' });
    expect(loadProgressMap('class5')).toEqual({ p5: { asked: 1 } });
    expect(loadSettings('class6')).toEqual({});
    expect(loadProgressMap('class6')).toEqual({});
  });

  it('persists active class with fallback', () => {
    expect(loadActiveClass(['class5', 'class6'], 'class5')).toBe('class5');

    saveActiveClass('class6');
    expect(loadActiveClass(['class5', 'class6'], 'class5')).toBe('class6');

    localStorage.setItem('activeClass', 'class9');
    expect(loadActiveClass(['class5', 'class6'], 'class5')).toBe('class5');
  });
});
