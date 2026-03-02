import { useState } from 'react';
import { DIRECTIONS } from '../../constants.js';

export function useQuizState(initialPage = '') {
  const [page, setPage] = useState(initialPage);
  const [direction, setDirection] = useState('mixed');
  const [lastRegularPage, setLastRegularPage] = useState(null);
  const [boardMode, setBoardMode] = useState(false);
  const [asked, setAsked] = useState(0);
  const [answeredCorrect, setAnsweredCorrect] = useState(new Set());
  const [completedPages, setCompletedPages] = useState(new Set());
  const [currentWord, setCurrentWord] = useState(null);
  const [currentQuestionDir, setCurrentQuestionDir] = useState(DIRECTIONS[0]);
  const [showingSolution, setShowingSolution] = useState(false);
  const [answerValue, setAnswerValue] = useState('');

  return {
    page,
    setPage,
    direction,
    setDirection,
    lastRegularPage,
    setLastRegularPage,
    boardMode,
    setBoardMode,
    asked,
    setAsked,
    answeredCorrect,
    setAnsweredCorrect,
    completedPages,
    setCompletedPages,
    currentWord,
    setCurrentWord,
    currentQuestionDir,
    setCurrentQuestionDir,
    showingSolution,
    setShowingSolution,
    answerValue,
    setAnswerValue,
  };
}
