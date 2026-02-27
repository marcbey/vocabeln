import { describe, expect, it } from 'vitest';
import {
  isCorrect,
  isCorrectIrregular,
  normalize,
  splitIrregularAnswer,
} from './answers.js';

describe('answers utils', () => {
  it('normalizes punctuation and spacing', () => {
    expect(normalize('  Hello...  World! ')).toBe('hello world');
  });

  it('accepts alternative expected spellings', () => {
    expect(isCorrect('Holiday', 'ferie/holiday')).toBe(true);
    expect(isCorrect('Vacation', 'ferie/holiday')).toBe(false);
  });

  it('splits irregular answers with separators', () => {
    expect(splitIrregularAnswer('go, went, gone')).toEqual([
      'go',
      'went',
      'gone',
    ]);
  });

  it('accepts irregular verbs including slash alternatives', () => {
    const verb = {
      infinitive: 'dream',
      simplePast: 'dreamed/dreamt',
      pastParticiple: 'dreamed/dreamt',
    };

    expect(isCorrectIrregular('dream, dreamt, dreamt', verb)).toBe(true);
    expect(isCorrectIrregular('dream, dreamed, dreamt', verb)).toBe(true);
    expect(isCorrectIrregular('dream, dream, dreamt', verb)).toBe(false);
  });
});
