import { DIRECTIONS } from '../constants.js';
import { answeredKey, countAnswered, rand } from './answers.js';

export const getPages = (data) => Object.keys(data);

export const totalQuestionsForPage = (page, vocabData) => {
  const list = vocabData[page] || [];
  return list.length * 2;
};

export function isPageComplete(answeredSet, page, direction, vocabData, irregularData) {
  if (direction === 'irregular') return countAnswered(answeredSet, 'irregular') >= irregularData.length;
  const list = vocabData[page] || [];
  if (!list.length) return false;
  return countAnswered(answeredSet, DIRECTIONS[0]) + countAnswered(answeredSet, DIRECTIONS[1]) >= list.length * 2;
}

export function pickWordForDirection({ direction, page, answeredCorrect, vocabData, irregularData, setCurrentQuestionDir }) {
  if (direction === 'irregular') {
    const remainingIrregular = irregularData.filter((item) => !answeredCorrect.has(answeredKey(item, 'irregular')));
    if (!remainingIrregular.length) return null;
    setCurrentQuestionDir('irregular');
    return remainingIrregular[rand(remainingIrregular.length)];
  }
  const list = vocabData[page] || [];
  const dirs = direction === 'mixed' ? DIRECTIONS : [direction];
  const candidates = [];
  list.forEach((item) => {
    dirs.forEach((d) => {
      if (!answeredCorrect.has(answeredKey(item, d))) {
        candidates.push({ item, dir: d });
      }
    });
  });
  if (!candidates.length) return null;
  const choice = candidates[rand(candidates.length)];
  setCurrentQuestionDir(choice.dir);
  return choice.item;
}
