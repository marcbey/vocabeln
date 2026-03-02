import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const UNIT_SCOPE_PREFIX = 'unit::';

function toUnitScopeKey(unit) {
  return `${UNIT_SCOPE_PREFIX}${unit}`;
}

function isUnitScopeKey(scopeKey) {
  return scopeKey.startsWith(UNIT_SCOPE_PREFIX);
}

function fromUnitScopeKey(scopeKey) {
  return scopeKey.replace(UNIT_SCOPE_PREFIX, '');
}

function dedupeVocabEntries(entries) {
  const seen = new Set();
  const deduped = [];

  entries.forEach((entry) => {
    const key = `${entry.en}::${entry.de}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(entry);
  });

  return deduped;
}

function buildUnitScopeVocabData({ vocabData, unitPages }) {
  return Object.fromEntries(
    Object.entries(unitPages).map(([unit, pages]) => {
      const mergedEntries = pages.flatMap((page) => vocabData[page] || []);
      return [toUnitScopeKey(unit), dedupeVocabEntries(mergedEntries)];
    })
  );
}

export function useQuizController({
  classId,
  vocabData,
  irregularData,
  unitPages = {},
}) {
  const pages = useMemo(() => getPages(vocabData), [vocabData]);
  const units = useMemo(() => Object.keys(unitPages), [unitPages]);
  const unitScopeVocabData = useMemo(
    () => buildUnitScopeVocabData({ vocabData, unitPages }),
    [unitPages, vocabData]
  );
  const scopeVocabData = useMemo(
    () => ({
      ...vocabData,
      ...unitScopeVocabData,
    }),
    [unitScopeVocabData, vocabData]
  );
  const scopePages = useMemo(
    () => [...pages, ...Object.keys(unitScopeVocabData)],
    [pages, unitScopeVocabData]
  );
  const inputRef = useRef(null);
  const [filterMode, setFilterMode] = useState('page');
  const [selectedPage, setSelectedPage] = useState(pages[0] ?? '');
  const [selectedUnit, setSelectedUnit] = useState(units[0] ?? '');

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
        scopeVocabData,
        irregularData
      ),
    [answeredCorrect, direction, irregularData, page, scopeVocabData]
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
    pages: scopePages,
    vocabData: scopeVocabData,
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
    changePage: changeScopePage,
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
    () => getTotalCount(page, direction, scopeVocabData, irregularData),
    [direction, irregularData, page, scopeVocabData]
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

  const completedUnits = useMemo(() => {
    const completed = new Set();
    units.forEach((unit) => {
      if (completedPages.has(toUnitScopeKey(unit))) {
        completed.add(unit);
      }
    });
    return completed;
  }, [completedPages, units]);

  const changePage = useCallback(
    (nextPage) => {
      setSelectedPage(nextPage);
      setFilterMode('page');
      changeScopePage(nextPage);
    },
    [changeScopePage]
  );

  const changeUnit = useCallback(
    (nextUnit) => {
      setSelectedUnit(nextUnit);
      setFilterMode('unit');
      const nextScopeKey = toUnitScopeKey(nextUnit);
      if (!scopePages.includes(nextScopeKey)) {
        return;
      }

      changeScopePage(nextScopeKey);
    },
    [changeScopePage, scopePages]
  );

  const changeFilterMode = useCallback(
    (nextMode) => {
      setFilterMode(nextMode);

      if (nextMode === 'unit') {
        const fallbackUnit = units[0] ?? '';
        const nextUnit = selectedUnit || fallbackUnit;
        if (!nextUnit) {
          return;
        }
        if (!selectedUnit) {
          setSelectedUnit(nextUnit);
        }

        const nextScopeKey = toUnitScopeKey(nextUnit);
        if (scopePages.includes(nextScopeKey)) {
          changeScopePage(nextScopeKey);
        }
        return;
      }

      const fallbackPage = pages[0] ?? '';
      const nextPage = selectedPage || fallbackPage;
      if (!nextPage) {
        return;
      }
      if (!selectedPage) {
        setSelectedPage(nextPage);
      }
      changeScopePage(nextPage);
    },
    [changeScopePage, pages, scopePages, selectedPage, selectedUnit, units]
  );

  useEffect(() => {
    if (pages.length && !pages.includes(selectedPage)) {
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  useEffect(() => {
    if (!units.length) {
      setSelectedUnit('');
      if (filterMode === 'unit') {
        setFilterMode('page');
      }
      return;
    }

    if (!units.includes(selectedUnit)) {
      setSelectedUnit(units[0]);
    }
  }, [filterMode, selectedUnit, units]);

  useEffect(() => {
    if (!scopePages.length) {
      return;
    }

    const session = hydrateSession(scopePages);
    if (!session) {
      return;
    }

    if (isUnitScopeKey(session.savedPage)) {
      const hydratedUnit = fromUnitScopeKey(session.savedPage);
      if (units.includes(hydratedUnit)) {
        setFilterMode('unit');
        setSelectedUnit(hydratedUnit);
      }
    } else if (pages.includes(session.savedPage)) {
      setFilterMode('page');
      setSelectedPage(session.savedPage);
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
    scopePages,
    setAnswerValue,
    setAsked,
    setAnsweredCorrect,
    setBoardMode,
    setCompletedPages,
    setDirection,
    setLastRegularPage,
    setPage,
    setShowingSolution,
    units,
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
    page: selectedPage,
    units,
    unit: selectedUnit,
    filterMode,
    direction,
    boardMode,
    completedPages,
    completedUnits,
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
    changeUnit,
    changeFilterMode,
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
