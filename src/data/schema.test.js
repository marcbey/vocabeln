import { describe, expect, it } from 'vitest';
import { parseIrregularData, parseVocabData } from './schema.js';

describe('data schema validation', () => {
  it('parses valid vocab data', () => {
    const parsed = parseVocabData({
      'Page 1': [{ en: 'cat', de: 'Katze' }],
    });

    expect(parsed['Page 1'][0]).toEqual({ en: 'cat', de: 'Katze' });
  });

  it('throws for invalid vocab shape', () => {
    expect(() =>
      parseVocabData({
        'Page 1': [{ en: '', de: 'Katze' }],
      })
    ).toThrow(/Vocab dataset is invalid/);
  });

  it('parses valid irregular verbs', () => {
    const parsed = parseIrregularData([
      {
        infinitive: 'be',
        simplePast: 'was/were',
        pastParticiple: 'been',
        german: 'sein',
      },
    ]);

    expect(parsed[0].infinitive).toBe('be');
  });

  it('throws for invalid irregular verbs', () => {
    expect(() =>
      parseIrregularData([
        {
          infinitive: 'be',
          simplePast: 'was/were',
          pastParticiple: '',
          german: 'sein',
        },
      ])
    ).toThrow(/Irregular verbs dataset is invalid/);
  });
});
