import { describe, expect, it } from 'vitest';
import { normalizeSpeechInputLanguage } from './useSpeechInput.js';

describe('useSpeechInput language normalization', () => {
  it('keeps german language values on de', () => {
    expect(normalizeSpeechInputLanguage('de')).toBe('de');
    expect(normalizeSpeechInputLanguage('de-DE')).toBe('de');
    expect(normalizeSpeechInputLanguage('deutsch')).toBe('de');
    expect(normalizeSpeechInputLanguage('german')).toBe('de');
  });

  it('keeps english language values on en', () => {
    expect(normalizeSpeechInputLanguage('en')).toBe('en');
    expect(normalizeSpeechInputLanguage('en-US')).toBe('en');
    expect(normalizeSpeechInputLanguage('englisch')).toBe('en');
    expect(normalizeSpeechInputLanguage('english')).toBe('en');
  });

  it('falls back to en for unsupported languages', () => {
    expect(normalizeSpeechInputLanguage('zh')).toBe('en');
    expect(normalizeSpeechInputLanguage('chinese')).toBe('en');
    expect(normalizeSpeechInputLanguage('')).toBe('en');
    expect(normalizeSpeechInputLanguage(undefined)).toBe('en');
  });
});
