import { DIRECTIONS } from '../../constants.js';
import { countAnswered } from '../../utils/answers.js';
import { totalQuestionsForPage } from '../../utils/quiz.js';

export function getQuestionDirection(direction, currentQuestionDir) {
  return direction === 'mixed' ? currentQuestionDir : direction;
}

export function getTotalCount(page, direction, vocabData, irregularData) {
  if (direction === 'irregular') {
    return irregularData.length;
  }

  return totalQuestionsForPage(page, vocabData);
}

export function getCorrectCount(answeredCorrect, direction) {
  if (direction === 'irregular') {
    return countAnswered(answeredCorrect, 'irregular');
  }

  return (
    countAnswered(answeredCorrect, DIRECTIONS[0]) +
    countAnswered(answeredCorrect, DIRECTIONS[1])
  );
}

export function getTranslation(currentWord, direction, currentQuestionDir) {
  if (!currentWord) {
    return '';
  }

  if (direction === 'irregular' || currentQuestionDir === 'irregular') {
    return `${currentWord.infinitive} · ${currentWord.simplePast} · ${currentWord.pastParticiple}`;
  }

  const questionDirection = getQuestionDirection(direction, currentQuestionDir);
  return questionDirection === DIRECTIONS[0] ? currentWord.de : currentWord.en;
}

export function getQuestionText(currentWord, direction, currentQuestionDir) {
  if (!currentWord) {
    return 'Mega! Alles richtig auf dieser Seite.';
  }

  if (direction === 'irregular' || currentQuestionDir === 'irregular') {
    return currentWord.german;
  }

  const questionDirection = getQuestionDirection(direction, currentQuestionDir);
  return questionDirection === DIRECTIONS[0] ? currentWord.en : currentWord.de;
}
