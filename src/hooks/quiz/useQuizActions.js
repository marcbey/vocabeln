import { useCallback } from 'react';
import { DIRECTIONS, IRREGULAR_PAGE_KEY } from '../../constants.js';
import { answeredKey, isCorrect, isCorrectIrregular } from '../../utils/answers.js';
import {
  isPageComplete as computePageComplete,
  pickWordForDirection,
} from '../../utils/quiz.js';
import { getQuestionDirection } from './selectors.js';

export function useQuizActions({
  pages,
  vocabData,
  irregularData,
  pageComplete,
  focusAnswer,
  launchFireworks,
  state,
  persistence,
  statusFlash,
}) {
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
    setCompletedPages,
    currentWord,
    setCurrentWord,
    currentQuestionDir,
    setCurrentQuestionDir,
    showingSolution,
    setShowingSolution,
    answerValue,
    setAnswerValue,
  } = state;

  const { persistSettings, loadPageProgress, persistProgress, clearStoredProgress } =
    persistence;
  const { setStatusFlash, clearStatusFlash, clearStatusOnly } = statusFlash;

  const applyPageProgress = useCallback(
    (progress) => {
      setAsked(progress.asked);
      setAnsweredCorrect(progress.answeredCorrect);
    },
    [setAnsweredCorrect, setAsked]
  );

  const resetQuestionUi = useCallback(() => {
    setShowingSolution(false);
    clearStatusFlash();
    setAnswerValue('');
  }, [clearStatusFlash, setAnswerValue, setShowingSolution]);

  const handleCompletion = useCallback(
    (nextAnswered = answeredCorrect) => {
      if (
        !computePageComplete(
          nextAnswered,
          page,
          direction,
          vocabData,
          irregularData
        )
      ) {
        return;
      }

      setCompletedPages((prev) => {
        if (prev.has(page)) {
          return prev;
        }

        const next = new Set(prev);
        next.add(page);
        launchFireworks();
        return next;
      });
    },
    [
      answeredCorrect,
      direction,
      irregularData,
      launchFireworks,
      page,
      setCompletedPages,
      vocabData,
    ]
  );

  const changeDirection = useCallback(
    (nextDirection) => {
      if (!pages.length) {
        return;
      }

      setDirection(nextDirection);
      resetQuestionUi();

      if (nextDirection === 'irregular') {
        if (page !== IRREGULAR_PAGE_KEY) {
          setLastRegularPage(page);
        }

        setPage(IRREGULAR_PAGE_KEY);
        applyPageProgress(loadPageProgress(IRREGULAR_PAGE_KEY));
        persistSettings(IRREGULAR_PAGE_KEY, nextDirection, boardMode);
        return;
      }

      if (page === IRREGULAR_PAGE_KEY) {
        const restoredPage =
          lastRegularPage && pages.includes(lastRegularPage)
            ? lastRegularPage
            : pages[0];

        setPage(restoredPage);
        applyPageProgress(loadPageProgress(restoredPage));
        persistSettings(restoredPage, nextDirection, boardMode);
        return;
      }

      persistSettings(page, nextDirection, boardMode);
    },
    [
      applyPageProgress,
      boardMode,
      lastRegularPage,
      loadPageProgress,
      page,
      pages,
      persistSettings,
      resetQuestionUi,
      setDirection,
      setLastRegularPage,
      setPage,
    ]
  );

  const changePage = useCallback(
    (nextPage) => {
      setPage(nextPage);
      applyPageProgress(loadPageProgress(nextPage));
      persistSettings(nextPage, direction, boardMode);
      resetQuestionUi();
      focusAnswer(40);
    },
    [
      applyPageProgress,
      boardMode,
      direction,
      focusAnswer,
      loadPageProgress,
      persistSettings,
      resetQuestionUi,
      setPage,
    ]
  );

  const autoSwitchDirectionIfNeeded = useCallback(() => {
    if (direction === 'mixed' || direction === 'irregular') {
      return false;
    }

    const otherDirection =
      direction === DIRECTIONS[0] ? DIRECTIONS[1] : DIRECTIONS[0];

    const pageWords = vocabData[page] || [];
    const hasUnansweredInOtherDirection = pageWords.some(
      (item) => !answeredCorrect.has(answeredKey(item, otherDirection))
    );

    if (!hasUnansweredInOtherDirection) {
      return false;
    }

    changeDirection(otherDirection);
    return true;
  }, [answeredCorrect, changeDirection, direction, page, vocabData]);

  const setNextWord = useCallback(() => {
    const nextWord = pickWordForDirection({
      direction,
      page,
      answeredCorrect,
      vocabData,
      irregularData,
      setCurrentQuestionDir,
    });

    if (!nextWord) {
      if (!pageComplete && direction !== 'mixed') {
        const switchedDirection = autoSwitchDirectionIfNeeded();
        if (switchedDirection) {
          return;
        }
      }

      setCurrentWord(null);
      return;
    }

    setCurrentWord(nextWord);
    setShowingSolution(false);
    clearStatusFlash();
    setAnswerValue('');
  }, [
    answeredCorrect,
    autoSwitchDirectionIfNeeded,
    clearStatusFlash,
    direction,
    irregularData,
    page,
    pageComplete,
    setAnswerValue,
    setCurrentQuestionDir,
    setCurrentWord,
    setShowingSolution,
    vocabData,
  ]);

  const submitRawAnswer = useCallback(
    (rawInput, { preserveInput = true } = {}) => {
      if (boardMode || showingSolution || !currentWord) {
        return;
      }

      const rawAnswer = rawInput.trim();
      if (!rawAnswer) {
        return;
      }

      if (preserveInput) {
        setAnswerValue(rawInput);
      }

      const questionDirection = getQuestionDirection(direction, currentQuestionDir);

      const correct =
        questionDirection === 'irregular'
          ? isCorrectIrregular(rawAnswer, currentWord)
          : isCorrect(
              rawAnswer,
              questionDirection === DIRECTIONS[0] ? currentWord.de : currentWord.en
            );

      const nextAsked = asked + 1;
      const nextAnswered = new Set(answeredCorrect);
      setAsked(nextAsked);

      if (correct) {
        nextAnswered.add(answeredKey(currentWord, questionDirection));
        setAnsweredCorrect(nextAnswered);
        setStatusFlash('correct');
        setAnswerValue('');

        const completedNow = computePageComplete(
          nextAnswered,
          page,
          direction,
          vocabData,
          irregularData
        );

        persistProgress({
          nextAnswered,
          nextAsked,
          completed: completedNow,
        });

        handleCompletion(nextAnswered);
        return;
      }

      setStatusFlash('wrong');
      persistProgress({
        nextAnswered,
        nextAsked,
        completed: computePageComplete(
          nextAnswered,
          page,
          direction,
          vocabData,
          irregularData
        ),
      });
    },
    [
      answeredCorrect,
      asked,
      boardMode,
      currentQuestionDir,
      currentWord,
      direction,
      handleCompletion,
      irregularData,
      page,
      persistProgress,
      setAnswerValue,
      setAnsweredCorrect,
      setAsked,
      setStatusFlash,
      showingSolution,
      vocabData,
    ]
  );

  const submitAnswer = useCallback(() => {
    if (boardMode || showingSolution || !currentWord) {
      return;
    }

    if (!answerValue.trim()) {
      return;
    }

    submitRawAnswer(answerValue, { preserveInput: false });
  }, [
    answerValue,
    boardMode,
    currentWord,
    submitRawAnswer,
    showingSolution,
  ]);

  const submitSpokenAnswer = useCallback(
    (spokenAnswer) => {
      if (!spokenAnswer) {
        return;
      }

      submitRawAnswer(spokenAnswer, { preserveInput: true });
    },
    [submitRawAnswer]
  );

  const applyBoardResult = useCallback(
    (isAnswerCorrect) => {
      if (!currentWord) {
        return;
      }

      const questionDirection = getQuestionDirection(direction, currentQuestionDir);
      const nextAnswered = new Set(answeredCorrect);
      const nextAsked = asked + 1;
      setAsked(nextAsked);

      if (isAnswerCorrect) {
        nextAnswered.add(answeredKey(currentWord, questionDirection));
        setAnsweredCorrect(nextAnswered);
        setStatusFlash('correct');

        const completedNow = computePageComplete(
          nextAnswered,
          page,
          direction,
          vocabData,
          irregularData
        );

        persistProgress({
          nextAnswered,
          nextAsked,
          completed: completedNow,
        });

        handleCompletion(nextAnswered);
        return;
      }

      setStatusFlash('wrong');
      persistProgress({
        nextAnswered,
        nextAsked,
        completed: computePageComplete(
          nextAnswered,
          page,
          direction,
          vocabData,
          irregularData
        ),
      });

      window.setTimeout(() => {
        setNextWord();
      }, boardMode ? 200 : 500);
    },
    [
      answeredCorrect,
      asked,
      boardMode,
      currentQuestionDir,
      currentWord,
      direction,
      handleCompletion,
      irregularData,
      page,
      persistProgress,
      setAnsweredCorrect,
      setAsked,
      setNextWord,
      setStatusFlash,
      vocabData,
    ]
  );

  const showOrAdvanceSolution = useCallback(() => {
    if (boardMode || !currentWord) {
      return;
    }

    if (showingSolution) {
      setShowingSolution(false);
      clearStatusFlash();
      setNextWord();
      return;
    }

    const nextAsked = asked + 1;
    setAsked(nextAsked);
    setShowingSolution(true);

    persistProgress({
      nextAsked,
      completed: computePageComplete(
        answeredCorrect,
        page,
        direction,
        vocabData,
        irregularData
      ),
    });
  }, [
    answeredCorrect,
    asked,
    boardMode,
    clearStatusFlash,
    currentWord,
    direction,
    irregularData,
    page,
    persistProgress,
    setAsked,
    setNextWord,
    setShowingSolution,
    showingSolution,
    vocabData,
  ]);

  const handleAnswerChange = useCallback(
    (value) => {
      setAnswerValue(value);
      clearStatusOnly();
    },
    [clearStatusOnly, setAnswerValue]
  );

  const toggleBoardMode = useCallback(() => {
    const nextBoardMode = !boardMode;
    setBoardMode(nextBoardMode);
    persistSettings(page, direction, nextBoardMode);

    if (!nextBoardMode && !showingSolution) {
      focusAnswer(20);
    }
  }, [
    boardMode,
    direction,
    focusAnswer,
    page,
    persistSettings,
    setBoardMode,
    showingSolution,
  ]);

  const resetAll = useCallback(() => {
    if (!window.confirm('Fortschritt wirklich löschen?')) {
      return;
    }

    if (!pages.length) {
      return;
    }

    const initialPage = pages[0];
    clearStoredProgress();

    setCompletedPages(new Set());
    setAnsweredCorrect(new Set());
    setAsked(0);
    setPage(initialPage);
    setDirection(DIRECTIONS[0]);
    setLastRegularPage(initialPage);
    setBoardMode(false);
    setCurrentWord(null);
    setCurrentQuestionDir(DIRECTIONS[0]);
    setShowingSolution(false);
    clearStatusFlash();
    setAnswerValue('');

    persistSettings(initialPage, DIRECTIONS[0], false);
  }, [
    clearStatusFlash,
    clearStoredProgress,
    pages,
    persistSettings,
    setAnswerValue,
    setAnsweredCorrect,
    setAsked,
    setBoardMode,
    setCompletedPages,
    setCurrentQuestionDir,
    setCurrentWord,
    setDirection,
    setLastRegularPage,
    setPage,
    setShowingSolution,
  ]);

  const retryPage = useCallback(() => {
    setCompletedPages((prev) => {
      const next = new Set(prev);
      next.delete(page);
      return next;
    });

    const emptyAnswers = new Set();
    setAnsweredCorrect(emptyAnswers);
    setAsked(0);
    setShowingSolution(false);
    clearStatusFlash();
    setAnswerValue('');

    persistProgress({
      nextAnswered: emptyAnswers,
      nextAsked: 0,
      completed: false,
    });

    setNextWord();
  }, [
    clearStatusFlash,
    page,
    persistProgress,
    setAnswerValue,
    setAnsweredCorrect,
    setAsked,
    setCompletedPages,
    setNextWord,
    setShowingSolution,
  ]);

  return {
    changeDirection,
    changePage,
    submitAnswer,
    submitSpokenAnswer,
    applyBoardResult,
    showOrAdvanceSolution,
    handleAnswerChange,
    toggleBoardMode,
    resetAll,
    retryPage,
    setNextWord,
  };
}
