import { describe, expect, it } from 'vitest';
import {
  extractVocabularyVariants,
  sentenceUsesVocabulary,
} from './generateExampleSentence.js';

describe('generateExampleSentence matching', () => {
  it('splits vocabulary variants on separators', () => {
    expect(extractVocabularyVariants('sich erkundigen nach; fragen')).toEqual([
      'sich erkundigen nach',
      'fragen',
    ]);
  });

  it('accepts inflected German forms for the same vocabulary', () => {
    expect(
      sentenceUsesVocabulary(
        'Ich spreche heute mit meiner Freundin über Musik.',
        ['sprechen über'],
        'de'
      )
    ).toBe(true);
  });

  it('accepts matching one of multiple German variants', () => {
    expect(
      sentenceUsesVocabulary(
        'Ich erkundige mich nach dem Weg zur Schule.',
        ['sich erkundigen nach', 'fragen'],
        'de'
      )
    ).toBe(true);
  });

  it('rejects unrelated sentences', () => {
    expect(
      sentenceUsesVocabulary(
        'Heute regnet es den ganzen Tag.',
        ['sprechen über'],
        'de'
      )
    ).toBe(false);
  });
});
