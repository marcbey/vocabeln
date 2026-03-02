import { afterEach, describe, expect, it, vi } from 'vitest';
import { answeredKey } from './answers.js';
import { isPageComplete, pickWordForDirection, totalQuestionsForPage } from './quiz.js';

const vocabData = {
  'Seite 1': [
    { en: 'cat', de: 'Katze' },
    { en: 'dog', de: 'Hund' },
  ],
};

const irregularData = [
  {
    german: 'sein',
    infinitive: 'be',
    simplePast: 'was',
    pastParticiple: 'been',
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('quiz utils', () => {
  it('calculates total questions for a regular page', () => {
    expect(totalQuestionsForPage('Seite 1', vocabData)).toBe(4);
  });

  it('marks regular page as complete only when both directions are answered', () => {
    const firstWord = vocabData['Seite 1'][0];
    const secondWord = vocabData['Seite 1'][1];

    const answered = new Set([
      answeredKey(firstWord, 'en-de'),
      answeredKey(firstWord, 'de-en'),
      answeredKey(secondWord, 'en-de'),
      answeredKey(secondWord, 'de-en'),
    ]);

    expect(isPageComplete(answered, 'Seite 1', 'mixed', vocabData, irregularData)).toBe(
      true
    );
  });

  it('picks only unanswered regular words', () => {
    const setCurrentQuestionDir = vi.fn();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const answered = new Set([
      answeredKey(vocabData['Seite 1'][0], 'en-de'),
      answeredKey(vocabData['Seite 1'][0], 'de-en'),
    ]);

    const picked = pickWordForDirection({
      direction: 'mixed',
      page: 'Seite 1',
      answeredCorrect: answered,
      vocabData,
      irregularData,
      setCurrentQuestionDir,
    });

    expect(picked).toEqual(vocabData['Seite 1'][1]);
    expect(setCurrentQuestionDir).toHaveBeenCalledWith('en-de');
  });

  it('picks irregular words and sets irregular direction', () => {
    const setCurrentQuestionDir = vi.fn();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const picked = pickWordForDirection({
      direction: 'irregular',
      page: 'Irreguläre Verben',
      answeredCorrect: new Set(),
      vocabData,
      irregularData,
      setCurrentQuestionDir,
    });

    expect(picked).toEqual(irregularData[0]);
    expect(setCurrentQuestionDir).toHaveBeenCalledWith('irregular');
  });
});
