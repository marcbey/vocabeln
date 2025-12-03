const localStore = window.localStorage;
const IRREGULAR_PAGE_KEY = 'Irreguläre Verben';
const DIRECTIONS = ['en-de', 'de-en'];
let lastRegularPage = null;

const state = {
  currentPage: null,
  direction: 'en-de',
  asked: 0,
  correct: 0,
  answeredCorrect: new Set(),
  currentWord: null,
  completedPages: new Set(),
  boardMode: false,
  currentQuestionDir: 'en-de',
};

const pageSelect = document.getElementById('pageSelect');
const directionSelect = document.getElementById('directionSelect');
const questionText = document.getElementById('questionText');
const questionArrow = document.getElementById('questionArrow');
const boardTranslation = document.getElementById('boardTranslation');
const answerInput = document.getElementById('answerInput');
const inputStatus = document.getElementById('inputStatus');
const submitBtn = document.getElementById('submitBtn');
const showBtn = document.getElementById('showBtn');
const boardModeBtn = document.getElementById('boardModeBtn');
const boardControls = document.getElementById('boardControls');
const boardCorrectBtn = document.getElementById('boardCorrectBtn');
const boardWrongBtn = document.getElementById('boardWrongBtn');
const entryControls = document.getElementById('entryControls');
const retryPageBtn = document.getElementById('retryPageBtn');
const badge = document.getElementById('progressBadge');
const currentPageLabel = document.getElementById('currentPageLabel');
const directionLabel = document.getElementById('directionLabel');
const correctCount = document.getElementById('correctCount');
const totalCount = document.getElementById('totalCount');
const fireworks = document.getElementById('fireworks');
const resetBtn = document.getElementById('resetBtn');
let showingSolution = false;
let statusTimer = null;
let flashTimer = null;

function keyFor(word) {
  return `${word.en || word.infinitive}|${word.de || word.german || ''}`;
}

function answeredKey(word, dir) {
  return `${keyFor(word)}|${dir}`;
}

function matchesDir(entry, dir) {
  const parts = entry.split('|');
  const entryDir = parts[2] || 'en-de'; // legacy entries without dir
  return entryDir === dir;
}

function isAnswered(word, dir) {
  const key = answeredKey(word, dir);
  if (state.answeredCorrect.has(key)) return true;
  if (state.answeredCorrect.has(keyFor(word)) && dir === 'en-de') return true; // legacy
  return false;
}

function countAnswered(dir) {
  let count = 0;
  state.answeredCorrect.forEach(entry => {
    if (matchesDir(entry, dir)) count += 1;
  });
  return count;
}

function syncCorrectCount() {
  if (state.direction === 'mixed') {
    state.correct = countAnswered('en-de') + countAnswered('de-en');
  } else if (state.direction === 'irregular') {
    state.correct = countAnswered('irregular');
  } else {
    state.correct = countAnswered(state.direction);
  }
}

function totalQuestionsForCurrentPage() {
  if (state.direction === 'irregular') return irregular.length;
  const list = vocabData[state.currentPage] || [];
  return list.length * (state.direction === 'mixed' ? 2 : 1);
}

function isPageComplete() {
  if (state.direction === 'irregular') {
    return countAnswered('irregular') >= irregular.length;
  }
  const list = vocabData[state.currentPage] || [];
  if (!list.length) return false;
  if (state.direction === 'mixed') {
    return countAnswered('en-de') + countAnswered('de-en') >= list.length * 2;
  }
  return countAnswered(state.direction) >= list.length;
}

function checkCompletion() {
  if (isPageComplete()) {
    triggerCelebration();
  }
}

async function loadSettings() {
  try { return JSON.parse(localStore.getItem('settings') || '{}'); } catch { return {}; }
}

async function saveSetting(key, value) {
  const current = await loadSettings();
  current[key] = value;
  localStore.setItem('settings', JSON.stringify(current));
}

async function loadProgress(page) {
  try {
    const all = JSON.parse(localStore.getItem('progress') || '{}');
    return all[page] || null;
  } catch {
    return null;
  }
}

async function saveProgress(page) {
  const answeredArr = Array.from(state.answeredCorrect);
  const payload = {
    page,
    asked: state.asked,
    correct: state.direction === 'mixed'
      ? countAnswered('en-de') + countAnswered('de-en')
      : state.direction === 'irregular'
        ? countAnswered('irregular')
        : countAnswered(state.direction),
    answered: JSON.stringify(answeredArr),
    completed: state.completedPages.has(page) ? 1 : 0,
  };
  const all = JSON.parse(localStore.getItem('progress') || '{}');
  all[page] = payload;
  localStore.setItem('progress', JSON.stringify(all));
}

async function loadCompletedPages() {
  try {
    const all = JSON.parse(localStore.getItem('progress') || '{}');
    Object.values(all).forEach(entry => {
      if (entry.completed) state.completedPages.add(entry.page);
    });
  } catch { /* ignore */ }
}

function populateDropdowns() {
  pageSelect.innerHTML = '';
  Object.keys(vocabData).forEach(page => {
    const opt = document.createElement('option');
    opt.value = page;
    opt.textContent = page;
    pageSelect.appendChild(opt);
  });
}

function updateLabels() {
  if (currentPageLabel) currentPageLabel.textContent = state.currentPage;
  if (state.direction === 'mixed') {
    if (directionLabel) directionLabel.textContent = 'Englisch ↔ Deutsch';
  } else if (state.direction === 'irregular') {
    if (directionLabel) directionLabel.textContent = 'Unregelmäßige Verben';
  } else {
    if (directionLabel) directionLabel.textContent = state.direction === 'en-de' ? 'Englisch → Deutsch' : 'Deutsch → Englisch';
  }
  syncCorrectCount();
  if (correctCount) correctCount.textContent = state.correct;
  const totalQuestions = totalQuestionsForCurrentPage();
  if (totalCount) totalCount.textContent = totalQuestions;
  badge.innerHTML = `<small>Fortschritt</small> ${state.correct} richtig · ${state.asked} Versuche · ${totalQuestions} Fragen`;
  markCompletedPages();
  setModeUI();
}

function setModeUI() {
  if (pageSelect) {
    if (state.direction === 'irregular') {
      pageSelect.classList.add('hidden');
    } else {
      pageSelect.classList.remove('hidden');
    }
  }
  if (isPageComplete()) {
    entryControls.classList.add('hidden');
    boardControls.classList.remove('show');
    retryPageBtn.classList.remove('hidden');
    showBtn.disabled = true;
    submitBtn.disabled = true;
    answerInput.disabled = true;
    boardTranslation.classList.add('hidden');
    questionArrow.classList.remove('show');
    return;
  } else {
    retryPageBtn.classList.add('hidden');
  }
  if (!showingSolution && !state.boardMode && state.direction !== 'irregular') {
    boardTranslation.classList.remove('show');
    questionArrow.classList.remove('show');
  }
  boardTranslation.classList.remove('hidden'); // keep box visible
  if (showingSolution && !state.boardMode) {
    answerInput.disabled = true;
    submitBtn.disabled = true;
    showBtn.disabled = false;
    boardTranslation.classList.add('show');
    questionArrow.classList.add('show');
    return;
  }
  if (state.boardMode) {
    entryControls.classList.add('hidden');
    boardControls.classList.add('show');
    boardModeBtn.classList.add('active');
    showBtn.disabled = true;
    submitBtn.disabled = true;
    answerInput.disabled = true;
    boardTranslation.classList.add('show');
    questionArrow.classList.add('show');
  } else {
    entryControls.classList.remove('hidden');
    boardControls.classList.remove('show');
    boardModeBtn.classList.remove('active');
    showBtn.disabled = false;
    submitBtn.disabled = false;
    answerInput.disabled = false;
    if (!showingSolution) questionArrow.classList.remove('show');
  }
}

function pickWord() {
  if (state.direction === 'irregular') {
    const remainingIrregular = irregular.filter(item => !isAnswered(item, 'irregular'));
    if (!remainingIrregular.length) {
      if (!state.completedPages.has(state.currentPage)) {
        triggerCelebration();
      }
      return null;
    }
    state.currentQuestionDir = 'irregular';
    return remainingIrregular[Math.floor(Math.random() * remainingIrregular.length)];
  }
  const list = vocabData[state.currentPage] || [];
  const dirs = state.direction === 'mixed' ? DIRECTIONS : [state.direction];
  const candidates = [];
  list.forEach(item => {
    dirs.forEach(dir => {
      if (!isAnswered(item, dir)) {
        candidates.push({ item, dir });
      }
    });
  });
  if (!candidates.length) {
    if (!state.completedPages.has(state.currentPage)) {
      triggerCelebration();
    }
    return null;
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  state.currentQuestionDir = choice.dir;
  return choice.item;
}

function presentWord() {
  state.currentWord = pickWord();
  if (!state.currentWord) {
    questionText.textContent = 'Mega! Alles richtig auf dieser Seite.';
    boardTranslation.textContent = '';
    boardTranslation.classList.remove('show');
    questionArrow.classList.remove('show');
    retryPageBtn.classList.remove('hidden');
    entryControls.classList.add('hidden');
    boardControls.classList.remove('show');
    answerInput.disabled = true;
    submitBtn.disabled = true;
    showBtn.disabled = true;
    return;
  }
  const dir = state.direction === 'mixed' ? state.currentQuestionDir : state.direction;
  if (dir === 'irregular') {
    questionText.textContent = state.currentWord.german;
    boardTranslation.textContent = `${state.currentWord.infinitive} · ${state.currentWord.simplePast} · ${state.currentWord.pastParticiple}`;
    boardTranslation.classList.remove('show');
    questionArrow.classList.remove('show');
    answerInput.placeholder = 'Infinitive, Simple Past, Past Participle';
  } else {
    questionText.textContent = dir === 'en-de' ? state.currentWord.en : state.currentWord.de;
    boardTranslation.textContent = dir === 'en-de' ? state.currentWord.de : state.currentWord.en;
    boardTranslation.classList.remove('show');
    questionArrow.classList.remove('show');
    answerInput.placeholder = 'Deine Antwort...';
  }
  answerInput.value = '';
  retryPageBtn.classList.add('hidden');
  if (state.boardMode) {
    answerInput.disabled = true;
    submitBtn.disabled = true;
    showBtn.disabled = true;
  } else {
    answerInput.focus();
    showingSolution = false;
    answerInput.disabled = false;
    submitBtn.disabled = false;
    showBtn.textContent = 'Lösung zeigen';
    showBtn.disabled = false;
  }
  clearStatus();
  setModeUI();
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/…/g, '')         /* remove ellipsis char */
    .replace(/\.{3}/g, ' ')     /* also remove three-dot ellipsis */
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
    alts.push(normalizeIrregularPart(exp)); // combined form accepted
    return alts.some(alt => parts[idx] === alt);
  });
}

function isCorrect(user, expected) {
  const userClean = normalize(user);
  // Split only on separators that indicate alternatives, not commas inside phrases
  const parts = expected.split(/;|\/|\(|\)/).map(normalize).filter(Boolean);
  return parts.some(p => p && userClean === p);
}

async function handleSubmit() {
  if (state.boardMode) return;
  if (!state.currentWord || showingSolution) return;
  const rawAnswer = answerInput.value.trim();
  if (!rawAnswer) return;

  state.asked += 1;
  const dir = state.direction === 'mixed' ? state.currentQuestionDir : state.direction;
  const correct = dir === 'irregular'
    ? isCorrectIrregular(rawAnswer, state.currentWord)
    : isCorrect(rawAnswer, dir === 'en-de' ? state.currentWord.de : state.currentWord.en);

  if (correct) {
    const key = answeredKey(state.currentWord, dir);
    state.answeredCorrect.add(key);
    syncCorrectCount();
    setStatus('correct');
    await saveProgress(state.currentPage);
    updateLabels();
    checkCompletion();
    setTimeout(() => {
      presentWord();
    }, 500);
  } else {
    setStatus('wrong');
    await saveProgress(state.currentPage);
  }
  updateLabels();
}

async function handleBoardResult(isCorrect) {
  if (!state.currentWord) return;
  state.asked += 1;
  if (isCorrect) {
    const key = answeredKey(state.currentWord, state.direction === 'mixed' ? state.currentQuestionDir : state.direction);
    state.answeredCorrect.add(key);
    syncCorrectCount();
    setStatus('correct');
    await saveProgress(state.currentPage);
    updateLabels();
    checkCompletion();
    setTimeout(() => presentWord(), 400);
  } else {
    setStatus('wrong');
    await saveProgress(state.currentPage);
    updateLabels();
    const delay = state.boardMode ? 200 : 500;
    setTimeout(() => presentWord(), delay);
  }
}

async function showSolution() {
  if (state.boardMode) return;
  if (showingSolution) {
    showingSolution = false;
    showBtn.textContent = 'Lösung zeigen';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    presentWord();
    return;
  }
  if (!state.currentWord) return;
  state.asked += 1; // counts as unsuccessful try
  const dir = state.direction === 'mixed' ? state.currentQuestionDir : state.direction;
  const solution = dir === 'irregular'
    ? `${state.currentWord.infinitive}, ${state.currentWord.simplePast}, ${state.currentWord.pastParticiple}`
    : (dir === 'en-de' ? state.currentWord.de : state.currentWord.en);
  boardTranslation.textContent = solution;
  showingSolution = true;
  boardTranslation.classList.add('show');
  questionArrow.classList.add('show');
  showBtn.textContent = 'Weiter';
  answerInput.disabled = true;
  submitBtn.disabled = true;
  await saveProgress(state.currentPage);
  updateLabels();
}

function clearStatus() {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  inputStatus.className = 'status-icon';
  inputStatus.textContent = '';
  document.querySelector('.card')?.classList.remove('flash-correct', 'flash-wrong');
}

function setStatus(type) {
  clearStatus();
  if (type === 'correct') {
    inputStatus.classList.add('show', 'correct');
    inputStatus.textContent = '✓';
    statusTimer = setTimeout(() => clearStatus(), 2000);
    document.querySelector('.card')?.classList.add('flash-correct');
  }
  if (type === 'wrong') {
    inputStatus.classList.add('show', 'wrong');
    inputStatus.textContent = '✗';
    document.querySelector('.card')?.classList.add('flash-wrong');
  }
  flashTimer = setTimeout(() => {
    document.querySelector('.card')?.classList.remove('flash-correct', 'flash-wrong');
  }, 450);
}

function triggerCelebration() {
  if (!state.completedPages.has(state.currentPage)) {
    state.completedPages.add(state.currentPage);
    launchFireworks();
  }
  markCompletedPages();
  saveProgress(state.currentPage);
}

function launchFireworks() {
  const colors = ['#ff8fb1', '#6df2a4', '#3cdfff', '#ffd66d', '#b18fff'];
  let bursts = 0;
  const timer = setInterval(() => {
    bursts += 1;
    const count = 25;
    const originX = Math.random() * window.innerWidth;
    const originY = (0.2 + Math.random() * 0.5) * window.innerHeight;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      const angle = (Math.PI * 2 * i) / count;
      const distance = 80 + Math.random() * 70;
      spark.style.left = originX + 'px';
      spark.style.top = originY + 'px';
      spark.style.background = colors[Math.floor(Math.random() * colors.length)];
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      fireworks.appendChild(spark);
      setTimeout(() => spark.remove(), 900);
    }
    if (bursts > 5) clearInterval(timer);
  }, 350);
}

async function changePage(newPage) {
  if (newPage === IRREGULAR_PAGE_KEY && state.direction !== 'irregular') {
    directionSelect.value = 'irregular';
    await changeDirection('irregular');
    return;
  }
  if (state.direction === 'irregular' && newPage !== IRREGULAR_PAGE_KEY) {
    directionSelect.value = 'en-de';
    await changeDirection('en-de');
    return;
  }
  state.currentPage = newPage;
  const saved = await loadProgress(newPage);
  if (saved) {
    state.asked = saved.asked || 0;
    try {
      const arr = JSON.parse(saved.answered || '[]');
      state.answeredCorrect = new Set(arr);
    } catch {
      state.answeredCorrect = new Set();
    }
    syncCorrectCount();
    if (saved.completed) state.completedPages.add(newPage);
  } else {
    state.asked = 0;
    state.correct = 0;
    state.answeredCorrect = new Set();
  }
  await saveSetting('currentPage', newPage);
  updateLabels();
  presentWord();
}

async function changeDirection(dir) {
  state.direction = dir;
  await saveSetting('direction', dir);
  if (dir === 'irregular') {
    lastRegularPage = state.currentPage !== IRREGULAR_PAGE_KEY ? state.currentPage : lastRegularPage;
    pageSelect.disabled = true;
    if (state.currentPage !== IRREGULAR_PAGE_KEY) {
      await changePage(IRREGULAR_PAGE_KEY);
      return;
    }
  } else {
    pageSelect.disabled = false;
    if (state.currentPage === IRREGULAR_PAGE_KEY) {
      const restore = lastRegularPage || Object.keys(vocabData)[0];
      pageSelect.value = restore;
      await changePage(restore);
      return;
    }
  }
  updateLabels();
  if (state.currentPage) presentWord();
}

async function toggleBoardMode() {
  state.boardMode = !state.boardMode;
  await saveSetting('boardMode', state.boardMode ? '1' : '0');
  setModeUI();
  if (!state.boardMode) {
    showingSolution = false;
    showBtn.textContent = 'Lösung zeigen';
  }
}

function markCompletedPages() {
  Array.from(pageSelect.options).forEach(opt => {
    const mark = state.completedPages.has(opt.value) ? ' ✅' : '';
    const base = opt.value.replace(' ✅', '');
    opt.textContent = base + mark;
  });
}

async function resetAll() {
  if (!confirm('Fortschritt wirklich löschen?')) return;
  state.completedPages.clear();
  localStore.removeItem('progress');
  localStore.removeItem('settings');
  state.asked = 0;
  state.correct = 0;
  state.answeredCorrect = new Set();
  populateDropdowns();
  pageSelect.value = Object.keys(vocabData)[0];
  await changePage(pageSelect.value);
  await changeDirection('en-de');
}

async function resetCurrentPageProgress() {
  if (!state.currentPage) return;
  state.completedPages.delete(state.currentPage);
  state.asked = 0;
  state.answeredCorrect = new Set();
  syncCorrectCount();
  showingSolution = false;
  await saveProgress(state.currentPage);
  updateLabels();
  presentWord();
}

async function init() {
  await loadCompletedPages();
  populateDropdowns();
  const settings = await loadSettings();
  const defaultPage = settings.currentPage || Object.keys(vocabData)[0];
  const defaultDir = settings.direction || 'en-de';
  state.boardMode = settings.boardMode === '1' || settings.boardMode === true || settings.boardMode === 'true';
  pageSelect.value = defaultPage;
  directionSelect.value = defaultDir;
  await changePage(defaultPage);
  await changeDirection(defaultDir);
  setModeUI();
  answerInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSubmit();
  });
  answerInput.addEventListener('input', clearStatus);
  submitBtn.addEventListener('click', handleSubmit);
  showBtn.addEventListener('click', showSolution);
  pageSelect.addEventListener('change', e => changePage(e.target.value));
  directionSelect.addEventListener('change', e => changeDirection(e.target.value));
  boardModeBtn.addEventListener('click', toggleBoardMode);
  boardCorrectBtn.addEventListener('click', () => handleBoardResult(true));
  boardWrongBtn.addEventListener('click', () => handleBoardResult(false));
  retryPageBtn.addEventListener('click', resetCurrentPageProgress);
  resetBtn.addEventListener('click', resetAll);
  updateLabels();
}

init();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.error('Service worker registration failed:', err);
    });
  });
}
