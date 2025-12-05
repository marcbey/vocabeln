import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import FireworksOverlay from './components/FireworksOverlay.jsx';
import { vocabData } from './data/vocab_data.js';
import { irregular } from './data/irregular_vocab_data.js';
import { useFireworks } from './hooks/useFireworks.js';
import { DIRECTIONS, IRREGULAR_PAGE_KEY } from './constants.js';
import { answeredKey, countAnswered, isCorrect, isCorrectIrregular } from './utils/answers.js';
import { getPages, isPageComplete as computePageComplete, pickWordForDirection, totalQuestionsForPage } from './utils/quiz.js';
import { clearAllProgress, loadProgressMap, loadSettings, saveProgressMap, saveSettings } from './utils/storage.js';

export default function App() {
  const pages = useMemo(() => getPages(vocabData), []);
  const inputRef = useRef(null);
  const flashTimerRef = useRef(null);

  const [page, setPage] = useState(pages[0]);
  const [direction, setDirection] = useState('mixed');
  const [lastRegularPage, setLastRegularPage] = useState(null);
  const [boardMode, setBoardMode] = useState(false);
  const [asked, setAsked] = useState(0);
  const [answeredCorrect, setAnsweredCorrect] = useState(new Set());
  const [completedPages, setCompletedPages] = useState(new Set());
  const [currentWord, setCurrentWord] = useState(null);
  const [currentQuestionDir, setCurrentQuestionDir] = useState('en-de');
  const [showingSolution, setShowingSolution] = useState(false);
  const [status, setStatusState] = useState(null);
  const [flash, setFlash] = useState(null);
  const { bursts, launch: launchFireworks } = useFireworks();

  const pageComplete = useMemo(
    () => computePageComplete(answeredCorrect, page, direction, vocabData, irregular),
    [answeredCorrect, direction, page]
  );

  const totalCount = useMemo(
    () => (direction === 'irregular' ? irregular.length : totalQuestionsForPage(page, vocabData)),
    [page, direction]
  );

  const correctCount = useMemo(
    () =>
      direction === 'irregular'
        ? countAnswered(answeredCorrect, 'irregular')
        : countAnswered(answeredCorrect, DIRECTIONS[0]) + countAnswered(answeredCorrect, DIRECTIONS[1]),
    [answeredCorrect, direction]
  );

  const persistSettings = (nextPage = page, nextDirection = direction, nextBoardMode = boardMode) => {
    saveSettings({ currentPage: nextPage, direction: nextDirection, boardMode: nextBoardMode });
  };

  const focusAnswer = (delay = 0) => {
    if (boardMode || showingSolution || pageComplete) return;
    if (!inputRef.current) return;
    setTimeout(() => {
      if (boardMode || showingSolution || pageComplete || !inputRef.current) return;
      const len = inputRef.current.value.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(len, len);
    }, delay);
  };

  function loadPageProgress(nextPage, progressMap = loadProgressMap()) {
    const entry = progressMap[nextPage];
    if (entry) {
      setAsked(entry.asked || 0);
      try {
        setAnsweredCorrect(new Set(JSON.parse(entry.answered || '[]')));
      } catch {
        setAnsweredCorrect(new Set());
      }
    } else {
      setAsked(0);
      setAnsweredCorrect(new Set());
    }
  }

  useEffect(() => {
    const settings = loadSettings();
    const progress = loadProgressMap();
    const completed = new Set();
    Object.values(progress).forEach((entry) => {
      if (entry.completed) completed.add(entry.page);
    });
    setCompletedPages(completed);
    const initialPage = settings.currentPage || pages[0];
    setPage(initialPage);
    setDirection(settings.direction || 'mixed');
    setBoardMode(settings.boardMode === true || settings.boardMode === '1' || settings.boardMode === 'true');
    loadPageProgress(initialPage, progress);
  }, [pages]);

  function persistProgress(nextAnswered = answeredCorrect, nextAsked = asked, completed = pageComplete) {
    const progress = loadProgressMap();
    const payload = {
      page,
      asked: nextAsked,
      correct:
        direction === 'irregular'
          ? countAnswered(nextAnswered, 'irregular')
          : countAnswered(nextAnswered, DIRECTIONS[0]) + countAnswered(nextAnswered, DIRECTIONS[1]),
      answered: JSON.stringify(Array.from(nextAnswered)),
      completed: completed ? 1 : 0,
    };
    progress[page] = payload;
    saveProgressMap(progress);
  }

  function handleCompletion(nextAnswered = answeredCorrect) {
    if (!computePageComplete(nextAnswered, page, direction, vocabData, irregular)) return;
    setCompletedPages((prev) => {
      if (prev.has(page)) return prev;
      const next = new Set(prev);
      next.add(page);
      launchFireworks();
      return next;
    });
  }

  function setStatusFlash(type) {
    setStatusState(type);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    if (type) {
      setFlash(type === 'correct' ? 'flash-correct' : 'flash-wrong');
      flashTimerRef.current = setTimeout(() => setFlash(null), 450);
      setTimeout(() => setStatusState(null), 2000);
    } else {
      setFlash(null);
    }
    if (type && !boardMode && !showingSolution) {
      focusAnswer(30);
    }
  }

  function switchDirection(newDir) {
    setDirection(newDir);
    persistSettings(page, newDir, boardMode);
    if (newDir === 'irregular') {
      if (page !== IRREGULAR_PAGE_KEY) {
        setLastRegularPage(page);
      }
      setPage(IRREGULAR_PAGE_KEY);
      loadPageProgress(IRREGULAR_PAGE_KEY);
    } else if (page === IRREGULAR_PAGE_KEY) {
      const restore = lastRegularPage || pages[0];
      setPage(restore);
      loadPageProgress(restore);
    }
    setShowingSolution(false);
  }

  function handleDirectionChange(value) {
    switchDirection(value);
    focusAnswer(40);
  }

  function handlePageChange(value) {
    setPage(value);
    loadPageProgress(value);
    persistSettings(value, direction, boardMode);
    setShowingSolution(false);
    focusAnswer(40);
  }

  function autoSwitchDirectionIfNeeded() {
    if (direction === 'mixed' || direction === 'irregular') return false;
    const other = direction === 'en-de' ? 'de-en' : 'en-de';
    const list = vocabData[page] || [];
    const remainingOther = list.some((item) => !answeredCorrect.has(answeredKey(item, other)));
    if (remainingOther) {
      switchDirection(other);
      return true;
    }
    return false;
  }

  function setNextWord(forceDir = direction) {
    if (forceDir !== direction && direction !== 'mixed') {
      setDirection(forceDir);
    }
    const dirToUse = direction === 'mixed' ? direction : forceDir;
    const word = pickWordForDirection({
      direction: dirToUse,
      page,
      answeredCorrect,
      vocabData,
      irregularData: irregular,
      setCurrentQuestionDir,
    });
    if (!word) {
      if (!pageComplete && direction !== 'mixed') {
        const switched = autoSwitchDirectionIfNeeded();
        if (switched) return;
      }
      setCurrentWord(null);
      return;
    }
    setCurrentWord(word);
    setShowingSolution(false);
  }

  useEffect(() => {
    setNextWord(direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, direction, answeredCorrect]);

  function handleSubmit() {
    if (boardMode || showingSolution || !currentWord) return;
    const raw = inputRef.current?.value.trim() || '';
    if (!raw) return;
    const dir = direction === 'mixed' ? currentQuestionDir : direction;
    const correct = dir === 'irregular'
      ? isCorrectIrregular(raw, currentWord)
      : isCorrect(raw, dir === 'en-de' ? currentWord.de : currentWord.en);

    setAsked((prev) => {
      const nextAsked = prev + 1;
      const nextAnswered = new Set(answeredCorrect);
      if (correct) {
        nextAnswered.add(answeredKey(currentWord, dir));
        setAnsweredCorrect(nextAnswered);
        const completedNow = computePageComplete(nextAnswered, page, direction, vocabData, irregular);
        persistProgress(nextAnswered, nextAsked, completedNow);
        setStatusFlash('correct');
        if (inputRef.current) inputRef.current.value = '';
        handleCompletion(nextAnswered);
      } else {
        persistProgress(nextAnswered, nextAsked, computePageComplete(nextAnswered, page, direction, vocabData, irregular));
        setStatusFlash('wrong');
      }
      return nextAsked;
    });
  }

  function handleBoardResult(isCorrectFlag) {
    if (!currentWord) return;
    const dir = direction === 'mixed' ? currentQuestionDir : direction;
    const nextAnswered = new Set(answeredCorrect);
    const nextAsked = asked + 1;
    if (isCorrectFlag) {
      nextAnswered.add(answeredKey(currentWord, dir));
      setAnsweredCorrect(nextAnswered);
      setStatusFlash('correct');
      const completedNow = computePageComplete(nextAnswered, page, direction, vocabData, irregular);
      handleCompletion(nextAnswered);
      persistProgress(nextAnswered, nextAsked, completedNow);
      setAsked(nextAsked);
    } else {
      setStatusFlash('wrong');
      persistProgress(nextAnswered, nextAsked, computePageComplete(nextAnswered, page, direction, vocabData, irregular));
      setAsked(nextAsked);
      setTimeout(() => setNextWord(direction), boardMode ? 200 : 500);
    }
  }

  function handleShowSolution() {
    if (boardMode || !currentWord) return;
    if (showingSolution) {
      setShowingSolution(false);
      setStatusFlash(null);
      setNextWord(direction);
      return;
    }
    const nextAsked = asked + 1;
    setAsked(nextAsked);
    setShowingSolution(true);
    persistProgress(answeredCorrect, nextAsked, computePageComplete(answeredCorrect, page, direction, vocabData, irregular));
  }

  function resetAll() {
    if (!window.confirm('Fortschritt wirklich löschen?')) return;
    clearAllProgress();
    setCompletedPages(new Set());
    setAnsweredCorrect(new Set());
    setAsked(0);
    setPage(pages[0]);
    setDirection('en-de');
    setBoardMode(false);
    setShowingSolution(false);
    setNextWord('en-de');
    persistSettings(pages[0], 'en-de', false);
  }

  function resetCurrentPageProgress() {
    setCompletedPages((prev) => {
      const next = new Set(prev);
      next.delete(page);
      return next;
    });
    setAnsweredCorrect(new Set());
    setAsked(0);
    setShowingSolution(false);
    persistProgress(new Set(), 0, false);
    setNextWord(direction);
  }

  const isIrregular = direction === 'irregular';

  const translation = useMemo(() => {
    if (!currentWord) return '';
    if (direction === 'irregular' || currentQuestionDir === 'irregular') {
      return `${currentWord.infinitive} · ${currentWord.simplePast} · ${currentWord.pastParticiple}`;
    }
    const dir = direction === 'mixed' ? currentQuestionDir : direction;
    return dir === 'en-de' ? currentWord.de : currentWord.en;
  }, [currentWord, direction, currentQuestionDir]);

  const questionText = useMemo(() => {
    if (!currentWord) return 'Mega! Alles richtig auf dieser Seite.';
    if (direction === 'irregular' || currentQuestionDir === 'irregular') {
      return currentWord.german;
    }
    const dir = direction === 'mixed' ? currentQuestionDir : direction;
    return dir === 'en-de' ? currentWord.en : currentWord.de;
  }, [currentWord, direction, currentQuestionDir]);

  useEffect(() => {
    if (!boardMode && !showingSolution && inputRef.current && !pageComplete) {
      const len = inputRef.current.value.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(len, len);
    }
  }, [boardMode, showingSolution, pageComplete]);

  useEffect(() => {
    focusAnswer(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, direction]);

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      <Header
        pages={pages}
        page={page}
        direction={direction}
        boardMode={boardMode}
        completedPages={completedPages}
        isIrregular={isIrregular}
        onPageChange={handlePageChange}
        onDirectionChange={handleDirectionChange}
        onToggleBoardMode={() => {
          const next = !boardMode;
          setBoardMode(next);
          persistSettings(page, direction, next);
          if (!next && !showingSolution && inputRef.current) {
            inputRef.current.focus();
          }
        }}
        onReset={resetAll}
      />

      <main className="w-full max-w-[1100px] grid grid-cols-1 gap-4">
        <QuestionCard
          questionText={questionText}
          translation={translation}
          showingSolution={showingSolution}
          boardMode={boardMode}
          pageComplete={pageComplete}
          flashClass={flash}
          status={status}
          direction={direction}
          isIrregular={isIrregular}
          currentWord={currentWord}
          inputRef={inputRef}
          counts={{ correctCount, asked, totalCount }}
          onSubmit={handleSubmit}
          onShowSolution={handleShowSolution}
          onBoardResult={handleBoardResult}
          onInputChange={() => setStatusState(null)}
          onRetry={resetCurrentPageProgress}
        />
      </main>

      <FireworksOverlay bursts={bursts} />
    </div>
  );
}
