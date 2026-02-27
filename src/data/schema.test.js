import { describe, expect, it } from 'vitest';
import { parseIrregularData, parseVocabData } from './schema.js';

describe('data schema validation', () => {
  it('parses valid vocab data', () => {
    const parsed = parseVocabData({
      'Class 5 - Page 1': [{ english: 'cat', german: 'Katze' }],
    });

    expect(parsed['Class 5 - Page 1'][0]).toEqual({
      english: 'cat',
      german: 'Katze',
    });
  });

  it('throws for invalid vocab shape', () => {
    expect(() =>
      parseVocabData({
        'Class 5 - Page 1': [{ english: '', german: 'Katze' }],
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
