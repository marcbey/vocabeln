import { useCallback, useEffect, useRef } from 'react';
import { DIRECTIONS, IRREGULAR_PAGE_KEY } from '../../constants.js';
import { answeredKey, isCorrect, isCorrectIrregular } from '../../utils/answers.js';
import {
  isPageComplete as computePageComplete,
  pickWordForDirection,
} from '../../utils/quiz.js';
import { getQuestionDirection } from './selectors.js';

const SPOKEN_CORRECT_PREVIEW_MS = 2000;

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
  const spokenSubmitTimerRef = useRef(null);

  const clearPendingSpokenSubmit = useCallback(() => {
    if (!spokenSubmitTimerRef.current) {
      return;
    }

    window.clearTimeout(spokenSubmitTimerRef.current);
    spokenSubmitTimerRef.current = null;
  }, []);

  useEffect(
    () => () => {
      clearPendingSpokenSubmit();
    },
    [clearPendingSpokenSubmit]
  );

  const applyPageProgress = useCallback(
    (progress) => {
      setAsked(progress.asked);
      setAnsweredCorrect(progress.answeredCorrect);
    },
    [setAnsweredCorrect, setAsked]
  );

  const resetQuestionUi = useCallback(() => {
    clearPendingSpokenSubmit();
    setShowingSolution(false);
    clearStatusFlash();
    setAnswerValue('');
  }, [
    clearPendingSpokenSubmit,
    clearStatusFlash,
    setAnswerValue,
    setShowingSolution,
  ]);

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
    clearPendingSpokenSubmit();

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
    clearStatusOnly();
    setAnswerValue('');
  }, [
    answeredCorrect,
    autoSwitchDirectionIfNeeded,
    clearPendingSpokenSubmit,
    clearStatusOnly,
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
      clearPendingSpokenSubmit();

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
      clearPendingSpokenSubmit,
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
    clearPendingSpokenSubmit();

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
    clearPendingSpokenSubmit,
    currentWord,
    submitRawAnswer,
    showingSolution,
  ]);

  const submitSpokenAnswer = useCallback(
    (spokenAnswer) => {
      if (!spokenAnswer) {
        return;
      }

      if (boardMode || showingSolution || !currentWord) {
        return;
      }

      const rawAnswer = spokenAnswer.trim();
      if (!rawAnswer) {
        return;
      }

      const questionDirection = getQuestionDirection(direction, currentQuestionDir);
      const expectedAnswer =
        questionDirection === DIRECTIONS[0] ? currentWord.de : currentWord.en;
      const spokenAnswerIsCorrect =
        questionDirection === 'irregular'
          ? isCorrectIrregular(rawAnswer, currentWord)
          : isCorrect(rawAnswer, expectedAnswer);

      if (!spokenAnswerIsCorrect) {
        submitRawAnswer(spokenAnswer, { preserveInput: true });
        return;
      }

      clearPendingSpokenSubmit();
      setAnswerValue(spokenAnswer);
      clearStatusOnly();

      spokenSubmitTimerRef.current = window.setTimeout(() => {
        spokenSubmitTimerRef.current = null;
        submitRawAnswer(spokenAnswer, { preserveInput: false });
      }, SPOKEN_CORRECT_PREVIEW_MS);
    },
    [
      boardMode,
      clearPendingSpokenSubmit,
      clearStatusOnly,
      currentQuestionDir,
      currentWord,
      direction,
      setAnswerValue,
      showingSolution,
      submitRawAnswer,
    ]
  );

  const applyBoardResult = useCallback(
    (isAnswerCorrect) => {
      clearPendingSpokenSubmit();

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
      clearPendingSpokenSubmit,
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
    clearPendingSpokenSubmit();

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
    clearPendingSpokenSubmit,
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
      clearPendingSpokenSubmit();
      setAnswerValue(value);
      clearStatusOnly();
    },
    [clearPendingSpokenSubmit, clearStatusOnly, setAnswerValue]
  );

  const toggleBoardMode = useCallback(() => {
    clearPendingSpokenSubmit();

    const nextBoardMode = !boardMode;
    setBoardMode(nextBoardMode);
    persistSettings(page, direction, nextBoardMode);

    if (!nextBoardMode && !showingSolution) {
      focusAnswer(20);
    }
  }, [
    boardMode,
    clearPendingSpokenSubmit,
    direction,
    focusAnswer,
    page,
    persistSettings,
    setBoardMode,
    showingSolution,
  ]);

  const resetAll = useCallback(() => {
    clearPendingSpokenSubmit();

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
    clearPendingSpokenSubmit,
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
    clearPendingSpokenSubmit();

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
    clearPendingSpokenSubmit,
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
