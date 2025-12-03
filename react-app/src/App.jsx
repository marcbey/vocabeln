import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { vocabData } from './data/vocab_data.js';
import { irregular } from './data/irregular_vocab_data.js';

const IRREGULAR_PAGE_KEY = 'Irreguläre Verben';
const DIRECTIONS = ['en-de', 'de-en'];
const SETTINGS_KEY = 'settings';
const PROGRESS_KEY = 'progress';

const rand = (max) => Math.floor(Math.random() * max);

function keyFor(word) {
  return `${word.en || word.infinitive}|${word.de || word.german || ''}`;
}

function answeredKey(word, dir) {
  return `${keyFor(word)}|${dir}`;
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/…/g, '')
    .replace(/\.\.\./g, ' ')
    .replace(/[,.;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeIrregularPart(str) {
  return str
    .toLowerCase()
    .replace(/…/g, '')
    .replace(/[.,;:!?]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIrregularAnswer(raw) {
  const primary = raw.split(/\s*[;,|]\s*/).filter(Boolean);
  if (primary.length >= 3) return primary.slice(0, 3);
  const secondary = raw.split(/\s{2,}/).filter(Boolean);
  if (secondary.length >= 3) return secondary.slice(0, 3);
  return raw.split(/\s+/).filter(Boolean).slice(0, 3);
}

function isCorrectIrregular(user, verb) {
  const parts = splitIrregularAnswer(user).map(normalizeIrregularPart);
  if (parts.length < 3) return false;
  const expected = [verb.infinitive, verb.simplePast, verb.pastParticiple];
  return expected.every((exp, idx) => {
    const alts = exp.split('/').map(normalizeIrregularPart).filter(Boolean);
    alts.push(normalizeIrregularPart(exp));
    return alts.some((alt) => parts[idx] === alt);
  });
}

function isCorrect(user, expected) {
  const userClean = normalize(user);
  const parts = expected.split(/;|\/|\(|\)/).map(normalize).filter(Boolean);
  return parts.some((p) => p && userClean === p);
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadProgressMap() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgressMap(map) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

function countAnswered(answeredSet, dir) {
  let count = 0;
  answeredSet.forEach((entry) => {
    const parts = entry.split('|');
    const entryDir = parts[2] || 'en-de';
    if (entryDir === dir) count += 1;
  });
  return count;
}

function getPages() {
  return Object.keys(vocabData);
}

function totalQuestionsForPage(page) {
  const list = vocabData[page] || [];
  return list.length * 2;
}

function Fireworks({ bursts }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10">
      {bursts.map((spark) => (
        <span
          key={spark.id}
          className="spark"
          style={{
            left: spark.x,
            top: spark.y,
            background: spark.color,
            ['--dx']: spark.dx,
            ['--dy']: spark.dy,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const pages = useMemo(() => getPages(), []);
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
  const [bursts, setBursts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flash, setFlash] = useState(null);

  const focusAnswer = (delay = 0) => {
    if (boardMode || showingSolution || pageComplete) return;
    if (inputRef.current) {
      setTimeout(() => {
        if (boardMode || showingSolution || pageComplete) return;
        const len = inputRef.current.value.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(len, len);
      }, delay);
    }
  };

  useEffect(() => {
    const settings = loadSettings();
    setPage(settings.currentPage || pages[0]);
    setDirection(settings.direction || 'mixed');
    setBoardMode(settings.boardMode === true || settings.boardMode === '1' || settings.boardMode === 'true');
    const progress = loadProgressMap();
    const completed = new Set();
    Object.values(progress).forEach((entry) => {
      if (entry.completed) completed.add(entry.page);
    });
    setCompletedPages(completed);
    if (settings.currentPage) {
      const prog = progress[settings.currentPage];
      if (prog) {
        setAsked(prog.asked || 0);
        try {
          setAnsweredCorrect(new Set(JSON.parse(prog.answered || '[]')));
        } catch {
          setAnsweredCorrect(new Set());
        }
      }
    }
  }, [pages]);

  const totalCount = useMemo(() => {
    if (direction === 'irregular') return irregular.length;
    return totalQuestionsForPage(page);
  }, [page, direction]);

  const correctCount = useMemo(() => {
    if (direction === 'irregular') return countAnswered(answeredCorrect, 'irregular');
    return countAnswered(answeredCorrect, 'en-de') + countAnswered(answeredCorrect, 'de-en');
  }, [answeredCorrect, direction]);

  function isPageComplete(setArg = answeredCorrect) {
    if (direction === 'irregular') return countAnswered(setArg, 'irregular') >= irregular.length;
    const list = vocabData[page] || [];
    if (!list.length) return false;
    return countAnswered(setArg, 'en-de') + countAnswered(setArg, 'de-en') >= list.length * 2;
  }

  const pageComplete = useMemo(() => isPageComplete(), [answeredCorrect, direction, page]);

  function persistProgress(nextAnswered = answeredCorrect, nextAsked = asked, completed = pageComplete) {
    const progress = loadProgressMap();
    const payload = {
      page,
      asked: nextAsked,
      correct: direction === 'irregular' ? countAnswered(nextAnswered, 'irregular') : countAnswered(nextAnswered, 'en-de') + countAnswered(nextAnswered, 'de-en'),
      answered: JSON.stringify(Array.from(nextAnswered)),
      completed: completed ? 1 : 0,
    };
    progress[page] = payload;
    saveProgressMap(progress);
  }

  function launchFireworks() {
    const colors = ['#ff8fb1', '#6df2a4', '#3cdfff', '#ffd66d', '#b18fff'];
    let burstsCount = 0;
    const timer = setInterval(() => {
      burstsCount += 1;
      const count = 25;
      const originX = Math.random() * window.innerWidth;
      const originY = (0.2 + Math.random() * 0.5) * window.innerHeight;
      const newSparks = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const distance = 80 + Math.random() * 70;
        newSparks.push({
          id: `${Date.now()}-${bursts.length}-${i}-${Math.random()}`,
          x: `${originX}px`,
          y: `${originY}px`,
          dx: `${Math.cos(angle) * distance}px`,
          dy: `${Math.sin(angle) * distance}px`,
          color: colors[rand(colors.length)],
        });
      }
      setBursts((prev) => [...prev, ...newSparks]);
      setTimeout(() => setBursts((prev) => prev.slice(newSparks.length)), 900);
      if (burstsCount > 5) clearInterval(timer);
    }, 350);
  }

  function handleCompletion(nextAnswered = answeredCorrect) {
    if (!isPageComplete(nextAnswered)) return;
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

  function loadPageProgress(nextPage) {
    const progress = loadProgressMap();
    const entry = progress[nextPage];
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

  function switchDirection(newDir) {
    setDirection(newDir);
    saveSettings({ currentPage: page, direction: newDir, boardMode });
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

  function handleDirectionChange(e) {
    const value = e.target.value;
    switchDirection(value);
    setMobileMenuOpen(false);
    focusAnswer(40);
  }

  function handlePageChange(e) {
    const newPage = e.target.value;
    setPage(newPage);
    loadPageProgress(newPage);
    saveSettings({ currentPage: newPage, direction, boardMode });
    setShowingSolution(false);
    setMobileMenuOpen(false);
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

  function pickWordForDirection(dir) {
    if (dir === 'irregular') {
      const remainingIrregular = irregular.filter((item) => !answeredCorrect.has(answeredKey(item, 'irregular')));
      if (!remainingIrregular.length) return null;
      setCurrentQuestionDir('irregular');
      return remainingIrregular[rand(remainingIrregular.length)];
    }
    const list = vocabData[page] || [];
    const dirs = direction === 'mixed' ? DIRECTIONS : [dir];
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

  function setNextWord(forceDir = direction) {
    if (forceDir !== direction && direction !== 'mixed') {
      setDirection(forceDir);
    }
    const dir = direction === 'mixed' ? direction : forceDir;
    if (dir === 'irregular') {
      const word = pickWordForDirection('irregular');
      setCurrentWord(word);
      setShowingSolution(false);
      return;
    }
    const word = pickWordForDirection(dir);
    if (!word) {
      if (!pageComplete) {
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
        const completedNow = isPageComplete(nextAnswered);
        persistProgress(nextAnswered, nextAsked, completedNow);
        setStatusFlash('correct');
        if (inputRef.current) inputRef.current.value = '';
        handleCompletion(nextAnswered);
      } else {
        persistProgress(nextAnswered, nextAsked, isPageComplete(nextAnswered));
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
      const completedNow = isPageComplete(nextAnswered);
      handleCompletion(nextAnswered);
      persistProgress(nextAnswered, nextAsked, completedNow);
      setAsked(nextAsked);
    } else {
      setStatusFlash('wrong');
      persistProgress(nextAnswered, nextAsked, isPageComplete(nextAnswered));
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
    persistProgress(answeredCorrect, nextAsked, isPageComplete(answeredCorrect));
  }

  function resetAll() {
    if (!window.confirm('Fortschritt wirklich löschen?')) return;
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    setCompletedPages(new Set());
    setAnsweredCorrect(new Set());
    setAsked(0);
    setPage(pages[0]);
    setDirection('en-de');
    setBoardMode(false);
    setShowingSolution(false);
    setNextWord('en-de');
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

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      <header className="w-full max-w-[1100px] bg-panel/80 backdrop-blur-md border border-white/10 rounded-xl2 px-4 py-3 md:px-5 md:py-3.5 flex flex-col md:flex-row md:items-center md:gap-4 gap-3 shadow-deep">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-xl tracking-tight flex items-center gap-2 font-extrabold">
            <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: 'linear-gradient(135deg, #3cdfff, #ff7ac3)', boxShadow: '0 0 14px rgba(255, 122, 195, 0.8)' }}></span>
            Orange Line 1 - Unit 1-6
          </h1>
          <button
            className="md:hidden secondary px-2 py-2 rounded-lg border flex flex-col items-end gap-1 min-w-[38px]"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menü öffnen"
          >
            <span className="block w-5 h-0.5 bg-text rounded-sm" />
            <span className="block w-5 h-0.5 bg-text rounded-sm" />
            <span className="block w-4 h-0.5 bg-text rounded-sm" />
          </button>
        </div>

        <div className="hidden md:flex flex-1 items-center gap-3">
          <div className="flex gap-3 items-center justify-end md:ml-auto">
            <div className={classNames('flex items-center', { 'opacity-50 pointer-events-none': isIrregular })}>
              <select
                value={page}
                onChange={handlePageChange}
                aria-label="Seite"
                className="pr-6 w-[120px] sm:w-[140px] truncate"
                disabled={isIrregular}
              >
                {pages.map((p) => (
                  <option key={p} value={p}>
                    {p}{completedPages.has(p) ? ' ✅' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <select value={direction} onChange={handleDirectionChange} aria-label="Richtung" className="pr-7 w-[190px] sm:w-[210px]">
                <option value="en-de">Englisch → Deutsch</option>
                <option value="de-en">Deutsch → Englisch</option>
                <option value="mixed">Englisch ↔ Deutsch</option>
                <option value="irregular">Irreguläre Verben</option>
              </select>
            </div>
          </div>
          <div className="hidden md:flex items-center px-3">
            <span className="w-px h-10 bg-white/20" aria-hidden />
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              className={classNames('toggle px-4 py-2 rounded-xl border', { active: boardMode })}
              onClick={() => {
                const next = !boardMode;
                setBoardMode(next);
                saveSettings({ currentPage: page, direction, boardMode: next });
                if (!next && !showingSolution && inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              Tafel-Modus
            </button>
            <button className="secondary px-4 py-2 rounded-xl border" onClick={resetAll}>
              Neu anfangen
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-3 bg-panel/90 border border-white/10 rounded-xl p-3 shadow-deep">
            <div className="flex gap-3 items-center justify-between">
              <div className={classNames('flex items-center flex-1 min-w-[150px] max-w-[200px]', { 'opacity-50 pointer-events-none': isIrregular })}>
                <select
                  value={page}
                  onChange={handlePageChange}
                  aria-label="Seite"
                  className="pr-7 w-full md:mr-2"
                  disabled={isIrregular}
                >
                  {pages.map((p) => (
                    <option key={p} value={p}>
                      {p}{completedPages.has(p) ? ' ✅' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center flex-1">
                <select value={direction} onChange={handleDirectionChange} aria-label="Richtung" className="pr-7 w-full md:mr-2">
                  <option value="en-de">Englisch → Deutsch</option>
                  <option value="de-en">Deutsch → Englisch</option>
                  <option value="mixed">Englisch ↔ Deutsch</option>
                  <option value="irregular">Irreguläre Verben</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className={classNames('toggle px-4 py-2 rounded-xl border w-full', { active: boardMode })}
                onClick={() => {
                  const next = !boardMode;
                  setBoardMode(next);
                  saveSettings({ currentPage: page, direction, boardMode: next });
                  setMobileMenuOpen(false);
                  if (!next && !showingSolution && inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                Tafel-Modus
              </button>
              <button className="secondary px-4 py-2 rounded-xl border w-full" onClick={() => { setMobileMenuOpen(false); resetAll(); }}>
                Neu anfangen
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-[1100px] grid grid-cols-1 gap-4">
        <section
          className={`bg-panel/90 border border-white/10 rounded-xl2 p-5 shadow-deep relative overflow-hidden flex flex-col ${flash || ''}`}
        >
          <div className="text-2xl font-extrabold mt-2 mb-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner flex flex-wrap gap-2 items-center text-center min-h-[86px]">
            <span className="flex items-center text-left">{questionText}</span>
            <span className={classNames('text-muted font-bold inline-flex items-center gap-1 transition-opacity duration-200', { 'opacity-100 visible': showingSolution || boardMode, 'opacity-0 invisible': !(showingSolution || boardMode) })}>
              →
            </span>
            <span className={classNames('text-lg text-muted px-3 py-1 rounded-lg border border-dashed border-white/20 bg-white/5 inline-flex items-center gap-2 transition-opacity duration-200', { 'opacity-100 visible': showingSolution || boardMode, 'opacity-0 invisible': !(showingSolution || boardMode) })}>
              {translation}
            </span>
          </div>

          {!pageComplete && !boardMode && (
            <>
              <div className="flex flex-wrap md:flex-nowrap gap-3 items-stretch mt-2 md:items-center">
                <div className="relative flex-1 min-w-[240px]">
                  <input
                    ref={inputRef}
                    type="text"
                  placeholder={direction === 'irregular' ? 'Infinitive, Simple Past, Past Participle' : 'Deine Antwort...'}
                    className="w-full pr-14 py-4.5 text-xl font-semibold rounded-2xl shadow-glow border-2 border-white/20 bg-[#0f1f33]/90 focus:ring-2 focus:ring-accent focus:border-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                    onInput={() => setStatusState(null)}
                    disabled={boardMode || showingSolution}
                  />
                  <span
                    className={classNames('absolute right-3 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none font-extrabold transition-opacity duration-200', {
                      'opacity-100 text-good': status === 'correct',
                      'opacity-100 text-[#ff8585]': status === 'wrong',
                    })}
                  >
                    {status === 'correct' ? '✓' : status === 'wrong' ? '✗' : ''}
                  </span>
                </div>
                <div className="hidden md:flex gap-3 w-full md:w-auto md:items-center md:justify-end">
                  <button className="px-4 whitespace-nowrap" onClick={handleSubmit} disabled={boardMode || showingSolution || !currentWord}>Check!</button>
                  <button className="secondary px-4 whitespace-nowrap" onClick={handleShowSolution} disabled={boardMode || !currentWord}>
                    {showingSolution ? 'Weiter' : 'Lösung zeigen'}
                  </button>
                </div>
              </div>
            </>
          )}

          {!pageComplete && boardMode && (
            <div className="flex flex-wrap gap-3 mt-3">
              <button className="flex-1 min-w-[140px] bg-gradient-to-r from-good to-[#8ef7be] text-[#063621]" onClick={() => handleBoardResult(true)}>
                ✓ Richtig
              </button>
              <button className="flex-1 min-w-[140px] bg-gradient-to-r from-[#ff8585] to-[#ffb4b4] text-[#3a0d0d]" onClick={() => handleBoardResult(false)}>
                ✗ Falsch
              </button>
            </div>
          )}

          {pageComplete && (
            <button className="retry-btn mt-3 w-full bg-gradient-to-r from-accent2 to-accent text-[#031524] font-extrabold py-3 rounded-xl" onClick={resetCurrentPageProgress}>
              Diese Seite nochmal üben
            </button>
          )}

          <div className="hidden md:flex mt-3 items-center justify-end">
            <div className="badge inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-400/20 to-pink-300/20 border border-white/10 font-bold text-text">
              <small className="text-muted font-semibold">Fortschritt</small>
              {correctCount} richtig · {asked} Versuche · {totalCount} Fragen
            </div>
          </div>

          <div className="md:hidden mt-3 flex flex-wrap sm:flex-nowrap items-center gap-3 justify-between">
            <div className="badge inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-400/20 to-pink-300/20 border border-white/10 font-bold text-text order-2 sm:order-1 w-full sm:w-auto">
              <small className="text-muted font-semibold">Fortschritt</small>
              {correctCount} richtig · {asked} Versuche · {totalCount} Fragen
            </div>
            {!pageComplete && !boardMode && (
              <div className="flex gap-3 ml-auto order-1 sm:order-2 w-full sm:w-auto justify-end">
                <button className="px-4 whitespace-nowrap" onClick={handleSubmit} disabled={boardMode || showingSolution || !currentWord}>Check!</button>
                <button className="secondary px-4 whitespace-nowrap" onClick={handleShowSolution} disabled={boardMode || !currentWord}>
                  {showingSolution ? 'Weiter' : 'Lösung zeigen'}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Fireworks bursts={bursts} />
    </div>
  );
}
