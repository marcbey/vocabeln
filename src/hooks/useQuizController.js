import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIRECTIONS, IRREGULAR_PAGE_KEY } from '../constants.js';
import { answeredKey, countAnswered, isCorrect, isCorrectIrregular } from '../utils/answers.js';
import {
  getPages,
  isPageComplete as computePageComplete,
  pickWordForDirection,
  totalQuestionsForPage,
} from '../utils/quiz.js';
import {
  clearAllProgress,
  loadProgressMap,
  loadSettings,
  saveProgressMap,
  saveSettings,
} from '../utils/storage.js';
import { useFireworks } from './useFireworks.js';

function parseAnsweredSet(entry) {
  try {
    return new Set(JSON.parse(entry?.answered || '[]'));
  } catch {
    return new Set();
  }
}

function parseBoardMode(value) {
  return value === true || value === '1' || value === 'true';
}

export function useQuizController({ vocabData, irregularData }) {
  const pages = useMemo(() => getPages(vocabData), [vocabData]);
  const inputRef = useRef(null);
  const flashTimerRef = useRef(null);
  const statusTimerRef = useRef(null);

  const [page, setPage] = useState(() => pages[0] ?? '');
  const [direction, setDirection] = useState('mixed');
  const [lastRegularPage, setLastRegularPage] = useState(null);
  const [boardMode, setBoardMode] = useState(false);
  const [asked, setAsked] = useState(0);
  const [answeredCorrect, setAnsweredCorrect] = useState(new Set());
  const [completedPages, setCompletedPages] = useState(new Set());
  const [currentWord, setCurrentWord] = useState(null);
  const [currentQuestionDir, setCurrentQuestionDir] = useState(DIRECTIONS[0]);
  const [showingSolution, setShowingSolution] = useState(false);
  const [status, setStatus] = useState(null);
  const [flash, setFlash] = useState(null);
  const [answerValue, setAnswerValue] = useState('');
  const { bursts, launch: launchFireworks } = useFireworks();

  const pageComplete = useMemo(
    () => computePageComplete(answeredCorrect, page, direction, vocabData, irregularData),
    [answeredCorrect, direction, irregularData, page, vocabData]
  );

  const totalCount = useMemo(
    () =>
      direction === 'irregular'
        ? irregularData.length
        : totalQuestionsForPage(page, vocabData),
    [direction, irregularData.length, page, vocabData]
  );

  const correctCount = useMemo(() => {
    if (direction === 'irregular') {
      return countAnswered(answeredCorrect, 'irregular');
    }
    return (
      countAnswered(answeredCorrect, DIRECTIONS[0]) +
      countAnswered(answeredCorrect, DIRECTIONS[1])
    );
  }, [answeredCorrect, direction]);

  const persistSettings = useCallback(
    (nextPage = page, nextDirection = direction, nextBoardMode = boardMode) => {
      saveSettings({
        currentPage: nextPage,
        direction: nextDirection,
        boardMode: nextBoardMode,
      });
    },
    [boardMode, direction, page]
  );

  const loadPageProgress = useCallback((nextPage, progressMap = loadProgressMap()) => {
    const entry = progressMap[nextPage];
    if (!entry) {
      setAsked(0);
      setAnsweredCorrect(new Set());
      return;
    }

    setAsked(entry.asked || 0);
    setAnsweredCorrect(parseAnsweredSet(entry));
  }, []);

  const focusAnswer = useCallback(
    (delay = 0) => {
      window.setTimeout(() => {
        if (boardMode || showingSolution || pageComplete || !inputRef.current) {
          return;
        }

        inputRef.current.focus();
        const position = inputRef.current.value.length;
        inputRef.current.setSelectionRange(position, position);
      }, delay);
    },
    [boardMode, pageComplete, showingSolution]
  );

  const persistProgress = useCallback(
    (
      nextAnswered = answeredCorrect,
      nextAsked = asked,
      completed = pageComplete
    ) => {
      const progress = loadProgressMap();
      const regularCorrect =
        countAnswered(nextAnswered, DIRECTIONS[0]) +
        countAnswered(nextAnswered, DIRECTIONS[1]);

      progress[page] = {
        page,
        asked: nextAsked,
        correct:
          direction === 'irregular'
            ? countAnswered(nextAnswered, 'irregular')
            : regularCorrect,
        answered: JSON.stringify(Array.from(nextAnswered)),
        completed: completed ? 1 : 0,
      };

      saveProgressMap(progress);
    },
    [answeredCorrect, asked, direction, page, pageComplete]
  );

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
    [answeredCorrect, direction, irregularData, launchFireworks, page, vocabData]
  );

  const setStatusFlash = useCallback(
    (nextStatus) => {
      setStatus(nextStatus);

      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }

      if (!nextStatus) {
        setFlash(null);
        return;
      }

      setFlash(nextStatus === 'correct' ? 'flash-correct' : 'flash-wrong');

      flashTimerRef.current = window.setTimeout(() => {
        setFlash(null);
      }, 450);

      statusTimerRef.current = window.setTimeout(() => {
        setStatus(null);
      }, 2000);

      if (!boardMode && !showingSolution) {
        focusAnswer(30);
      }
    },
    [boardMode, focusAnswer, showingSolution]
  );

  const changeDirection = useCallback(
    (newDirection) => {
      if (!pages.length) {
        return;
      }

      setDirection(newDirection);
      setShowingSolution(false);
      setStatus(null);
      setFlash(null);
      setAnswerValue('');

      if (newDirection === 'irregular') {
        if (page !== IRREGULAR_PAGE_KEY) {
          setLastRegularPage(page);
        }
        setPage(IRREGULAR_PAGE_KEY);
        loadPageProgress(IRREGULAR_PAGE_KEY);
        persistSettings(IRREGULAR_PAGE_KEY, newDirection, boardMode);
        return;
      }

      if (page === IRREGULAR_PAGE_KEY) {
        const restorePage =
          lastRegularPage && pages.includes(lastRegularPage)
            ? lastRegularPage
            : pages[0];
        setPage(restorePage);
        loadPageProgress(restorePage);
        persistSettings(restorePage, newDirection, boardMode);
        return;
      }

      persistSettings(page, newDirection, boardMode);
    },
    [
      boardMode,
      lastRegularPage,
      loadPageProgress,
      page,
      pages,
      persistSettings,
    ]
  );

  const changePage = useCallback(
    (nextPage) => {
      setPage(nextPage);
      loadPageProgress(nextPage);
      persistSettings(nextPage, direction, boardMode);
      setShowingSolution(false);
      setStatus(null);
      setFlash(null);
      setAnswerValue('');
      focusAnswer(40);
    },
    [boardMode, direction, focusAnswer, loadPageProgress, persistSettings]
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
        const switched = autoSwitchDirectionIfNeeded();
        if (switched) {
          return;
        }
      }
      setCurrentWord(null);
      return;
    }

    setCurrentWord(nextWord);
    setShowingSolution(false);
    setStatus(null);
    setAnswerValue('');
  }, [
    answeredCorrect,
    autoSwitchDirectionIfNeeded,
    direction,
    irregularData,
    page,
    pageComplete,
    vocabData,
  ]);

  const submitAnswer = useCallback(() => {
    if (boardMode || showingSolution || !currentWord) {
      return;
    }

    const rawAnswer = answerValue.trim();
    if (!rawAnswer) {
      return;
    }

    const questionDirection =
      direction === 'mixed' ? currentQuestionDir : direction;

    const isAnswerCorrect =
      questionDirection === 'irregular'
        ? isCorrectIrregular(rawAnswer, currentWord)
        : isCorrect(
            rawAnswer,
            questionDirection === DIRECTIONS[0] ? currentWord.de : currentWord.en
          );

    const nextAsked = asked + 1;
    const nextAnswered = new Set(answeredCorrect);

    setAsked(nextAsked);

    if (isAnswerCorrect) {
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
      persistProgress(nextAnswered, nextAsked, completedNow);
      handleCompletion(nextAnswered);
      return;
    }

    setStatusFlash('wrong');
    persistProgress(
      nextAnswered,
      nextAsked,
      computePageComplete(nextAnswered, page, direction, vocabData, irregularData)
    );
  }, [
    answerValue,
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
    setStatusFlash,
    showingSolution,
    vocabData,
  ]);

  const applyBoardResult = useCallback(
    (isAnswerCorrect) => {
      if (!currentWord) {
        return;
      }

      const questionDirection =
        direction === 'mixed' ? currentQuestionDir : direction;
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

        persistProgress(nextAnswered, nextAsked, completedNow);
        handleCompletion(nextAnswered);
        return;
      }

      setStatusFlash('wrong');
      persistProgress(
        nextAnswered,
        nextAsked,
        computePageComplete(nextAnswered, page, direction, vocabData, irregularData)
      );

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
      setStatusFlash(null);
      setNextWord();
      return;
    }

    const nextAsked = asked + 1;
    setAsked(nextAsked);
    setShowingSolution(true);

    persistProgress(
      answeredCorrect,
      nextAsked,
      computePageComplete(answeredCorrect, page, direction, vocabData, irregularData)
    );
  }, [
    answeredCorrect,
    asked,
    boardMode,
    currentWord,
    direction,
    irregularData,
    page,
    persistProgress,
    setNextWord,
    setStatusFlash,
    showingSolution,
    vocabData,
  ]);

  const handleAnswerChange = useCallback((value) => {
    setAnswerValue(value);
    setStatus(null);
  }, []);

  const toggleBoardMode = useCallback(() => {
    const nextBoardMode = !boardMode;
    setBoardMode(nextBoardMode);
    persistSettings(page, direction, nextBoardMode);

    if (!nextBoardMode && !showingSolution) {
      focusAnswer(20);
    }
  }, [boardMode, direction, focusAnswer, page, persistSettings, showingSolution]);

  const resetAll = useCallback(() => {
    if (!window.confirm('Fortschritt wirklich löschen?')) {
      return;
    }

    const initialPage = pages[0];
    clearAllProgress();

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
    setStatus(null);
    setFlash(null);
    setAnswerValue('');

    persistSettings(initialPage, DIRECTIONS[0], false);
  }, [pages, persistSettings]);

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
    setStatus(null);
    setFlash(null);
    setAnswerValue('');
    persistProgress(emptyAnswers, 0, false);
    setNextWord();
  }, [page, persistProgress, setNextWord]);

  useEffect(() => {
    if (!pages.length) {
      return;
    }

    const settings = loadSettings();
    const progressMap = loadProgressMap();

    const completed = new Set();
    Object.values(progressMap).forEach((entry) => {
      if (entry?.completed) {
        completed.add(entry.page);
      }
    });
    setCompletedPages(completed);

    const savedDirection = settings.direction || 'mixed';
    const savedPage = pages.includes(settings.currentPage)
      ? settings.currentPage
      : pages[0];

    const initialPage =
      savedDirection === 'irregular' ? IRREGULAR_PAGE_KEY : savedPage;

    setDirection(savedDirection);
    setPage(initialPage);
    setLastRegularPage(savedPage);
    setBoardMode(parseBoardMode(settings.boardMode));
    setShowingSolution(false);
    setStatus(null);
    setFlash(null);
    setAnswerValue('');

    loadPageProgress(initialPage, progressMap);
  }, [loadPageProgress, pages]);

  useEffect(() => {
    setNextWord();
  }, [page, direction, answeredCorrect, setNextWord]);

  useEffect(() => {
    if (!boardMode && !showingSolution && !pageComplete) {
      focusAnswer(40);
    }
  }, [boardMode, focusAnswer, pageComplete, showingSolution]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const translation = useMemo(() => {
    if (!currentWord) {
      return '';
    }

    if (direction === 'irregular' || currentQuestionDir === 'irregular') {
      return `${currentWord.infinitive} · ${currentWord.simplePast} · ${currentWord.pastParticiple}`;
    }

    const questionDirection =
      direction === 'mixed' ? currentQuestionDir : direction;
    return questionDirection === DIRECTIONS[0] ? currentWord.de : currentWord.en;
  }, [currentQuestionDir, currentWord, direction]);

  const questionText = useMemo(() => {
    if (!currentWord) {
      return 'Mega! Alles richtig auf dieser Seite.';
    }

    if (direction === 'irregular' || currentQuestionDir === 'irregular') {
      return currentWord.german;
    }

    const questionDirection =
      direction === 'mixed' ? currentQuestionDir : direction;
    return questionDirection === DIRECTIONS[0] ? currentWord.en : currentWord.de;
  }, [currentQuestionDir, currentWord, direction]);

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
    showOrAdvanceSolution,
    applyBoardResult,
    handleAnswerChange,
    resetAll,
    retryPage,
  };
}
