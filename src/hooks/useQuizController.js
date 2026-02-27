import { useCallback, useEffect, useMemo, useRef } from 'react';
import { isPageComplete as computePageComplete, getPages } from '../utils/quiz.js';
import { useFireworks } from './useFireworks.js';
import { useQuizActions } from './quiz/useQuizActions.js';
import { useQuizPersistence } from './quiz/useQuizPersistence.js';
import {
  getAnswerLanguage,
  getCorrectCount,
  getQuestionLanguage,
  getQuestionText,
  getTotalCount,
  getTranslation,
} from './quiz/selectors.js';
import { useQuizState } from './quiz/useQuizState.js';
import { useQuizStatusFlash } from './quiz/useQuizStatusFlash.js';

export function useQuizController({ classId, vocabData, irregularData }) {
  const pages = useMemo(() => getPages(vocabData), [vocabData]);
  const inputRef = useRef(null);

  const {
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
  } = useQuizState(pages[0] ?? '');

  const pageComplete = useMemo(
    () =>
      computePageComplete(
        answeredCorrect,
        page,
        direction,
        vocabData,
        irregularData
      ),
    [answeredCorrect, direction, irregularData, page, vocabData]
  );

  const focusAnswer = useCallback(
    (delay = 0) => {
      window.setTimeout(() => {
        if (boardMode || showingSolution || pageComplete || !inputRef.current) {
          return;
        }

        inputRef.current.focus();
        const selectionPosition = inputRef.current.value.length;
        inputRef.current.setSelectionRange(selectionPosition, selectionPosition);
      }, delay);
    },
    [boardMode, pageComplete, showingSolution]
  );

  const persistence = useQuizPersistence({
    classId,
    page,
    direction,
    boardMode,
    asked,
    answeredCorrect,
    pageComplete,
  });
  const { hydrateSession } = persistence;

  const { bursts, launch: launchFireworks } = useFireworks();

  const statusFlash = useQuizStatusFlash({
    boardMode,
    showingSolution,
    onRefocus: () => focusAnswer(30),
  });
  const { status, flash, clearStatusFlash } = statusFlash;

  const actions = useQuizActions({
    pages,
    vocabData,
    irregularData,
    pageComplete,
    focusAnswer,
    launchFireworks,
    state: {
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
    },
    persistence,
    statusFlash,
  });
  const {
    changePage,
    changeDirection,
    toggleBoardMode,
    submitAnswer,
    submitSpokenAnswer,
    showOrAdvanceSolution,
    applyBoardResult,
    handleAnswerChange,
    resetAll,
    retryPage,
    setNextWord,
  } = actions;

  const totalCount = useMemo(
    () => getTotalCount(page, direction, vocabData, irregularData),
    [direction, irregularData, page, vocabData]
  );

  const correctCount = useMemo(
    () => getCorrectCount(answeredCorrect, direction),
    [answeredCorrect, direction]
  );

  const translation = useMemo(
    () => getTranslation(currentWord, direction, currentQuestionDir),
    [currentQuestionDir, currentWord, direction]
  );

  const questionText = useMemo(
    () => getQuestionText(currentWord, direction, currentQuestionDir),
    [currentQuestionDir, currentWord, direction]
  );

  const questionLanguage = useMemo(
    () => getQuestionLanguage(direction, currentQuestionDir),
    [currentQuestionDir, direction]
  );

  const answerLanguage = useMemo(
    () => getAnswerLanguage(direction, currentQuestionDir),
    [currentQuestionDir, direction]
  );

  useEffect(() => {
    if (!pages.length) {
      return;
    }

    const session = hydrateSession(pages);
    if (!session) {
      return;
    }

    setDirection(session.direction);
    setPage(session.initialPage);
    setLastRegularPage(session.savedPage);
    setBoardMode(session.boardMode);
    setCompletedPages(session.completedPages);
    setAsked(session.pageProgress.asked);
    setAnsweredCorrect(session.pageProgress.answeredCorrect);
    setShowingSolution(false);
    setAnswerValue('');
    clearStatusFlash();
  }, [
    clearStatusFlash,
    hydrateSession,
    pages,
    setAnswerValue,
    setAsked,
    setAnsweredCorrect,
    setBoardMode,
    setCompletedPages,
    setDirection,
    setLastRegularPage,
    setPage,
    setShowingSolution,
  ]);

  useEffect(() => {
    setNextWord();
  }, [answeredCorrect, direction, page, setNextWord]);

  useEffect(() => {
    if (!boardMode && !showingSolution && !pageComplete) {
      focusAnswer(40);
    }
  }, [boardMode, focusAnswer, pageComplete, showingSolution]);

  return {
    bursts,
    pages,
    page,
    direction,
    boardMode,
    completedPages,
    pageComplete,
    isIrregular: direction === 'irregular',
    currentWord,
    showingSolution,
    questionText,
    questionLanguage,
    answerLanguage,
    translation,
    status,
    flash,
    inputRef,
    answerValue,
    counts: {
      correctCount,
      asked,
      totalCount,
    },
    changePage,
    changeDirection,
    toggleBoardMode,
    submitAnswer,
    submitSpokenAnswer,
    showOrAdvanceSolution,
    applyBoardResult,
    handleAnswerChange,
    resetAll,
    retryPage,
  };
}
