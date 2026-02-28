import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import FireworksOverlay from './components/FireworksOverlay.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import {
  CLASS_DATASETS,
  CLASS_OPTIONS,
  DEFAULT_CLASS_ID,
} from './data/index.js';
import { useQuizController } from './hooks/useQuizController.js';
import { loadActiveClass, saveActiveClass } from './utils/storage.js';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';
const MAIN_INTERACTION_SELECTOR =
  'button, [role="button"], input, select, textarea, [data-main-action]';

function isMobileViewport() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  }

  return window.innerWidth <= 767;
}

function shouldTriggerMainAutoScroll(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  const actionElement = target.closest(MAIN_INTERACTION_SELECTOR);
  if (!actionElement) {
    return false;
  }

  if (
    actionElement instanceof HTMLButtonElement ||
    actionElement instanceof HTMLInputElement ||
    actionElement instanceof HTMLSelectElement ||
    actionElement instanceof HTMLTextAreaElement
  ) {
    return !actionElement.disabled;
  }

  return actionElement.getAttribute('aria-disabled') !== 'true';
}

export default function App() {
  const [activeClassId, setActiveClassId] = useState(() =>
    loadActiveClass(
      CLASS_OPTIONS.map((item) => item.id),
      DEFAULT_CLASS_ID
    )
  );

  useEffect(() => {
    saveActiveClass(activeClassId);
  }, [activeClassId]);

  const activeClass = useMemo(
    () => CLASS_OPTIONS.find((item) => item.id === activeClassId) ?? CLASS_OPTIONS[0],
    [activeClassId]
  );

  const activeDataset = CLASS_DATASETS[activeClassId] ?? CLASS_DATASETS[DEFAULT_CLASS_ID];
  const [speechPlaybackError, setSpeechPlaybackError] = useState('');
  const [speechInputError, setSpeechInputError] = useState('');
  const mainRef = useRef(null);

  const quiz = useQuizController({
    classId: activeClassId,
    vocabData: activeDataset.vocabData,
    irregularData: activeDataset.irregularData,
  });

  const handleSpeechPlaybackErrorChange = useCallback((nextError) => {
    setSpeechPlaybackError(nextError || '');
  }, []);

  const handleSpeechInputErrorChange = useCallback((nextError) => {
    setSpeechInputError(nextError || '');
  }, []);

  const scrollMainIntoViewOnMobileInteraction = useCallback(() => {
    if (!isMobileViewport()) {
      return;
    }

    window.requestAnimationFrame(() => {
      mainRef.current?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, []);

  const handleMainPointerDownCapture = useCallback(
    (event) => {
      if (!shouldTriggerMainAutoScroll(event.target)) {
        return;
      }

      scrollMainIntoViewOnMobileInteraction();
    },
    [scrollMainIntoViewOnMobileInteraction]
  );

  const handleMainKeyDownCapture = useCallback(
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      if (!shouldTriggerMainAutoScroll(event.target)) {
        return;
      }

      scrollMainIntoViewOnMobileInteraction();
    },
    [scrollMainIntoViewOnMobileInteraction]
  );

  return (
    <div className="flex w-full flex-col items-center gap-4 md:gap-5">
      <Header
        headline={activeClass.headline}
        activeClassId={activeClassId}
        classOptions={CLASS_OPTIONS}
        pages={quiz.pages}
        page={quiz.page}
        direction={quiz.direction}
        boardMode={quiz.boardMode}
        completedPages={quiz.completedPages}
        isIrregular={quiz.isIrregular}
        onClassChange={setActiveClassId}
        onPageChange={quiz.changePage}
        onDirectionChange={quiz.changeDirection}
        onToggleBoardMode={quiz.toggleBoardMode}
        onReset={quiz.resetAll}
      />

      <main
        ref={mainRef}
        className="w-full max-w-[1100px] grid grid-cols-1 gap-4"
        onPointerDownCapture={handleMainPointerDownCapture}
        onKeyDownCapture={handleMainKeyDownCapture}
      >
        <QuestionCard
          questionText={quiz.questionText}
          questionLanguage={quiz.questionLanguage}
          answerLanguage={quiz.answerLanguage}
          translation={quiz.translation}
          showingSolution={quiz.showingSolution}
          boardMode={quiz.boardMode}
          pageComplete={quiz.pageComplete}
          flashClass={quiz.flash}
          status={quiz.status}
          isIrregular={quiz.isIrregular}
          currentWord={quiz.currentWord}
          answerValue={quiz.answerValue}
          inputRef={quiz.inputRef}
          counts={quiz.counts}
          onSubmit={quiz.submitAnswer}
          onSubmitSpokenAnswer={quiz.submitSpokenAnswer}
          onShowSolution={quiz.showOrAdvanceSolution}
          onBoardResult={quiz.applyBoardResult}
          onAnswerChange={quiz.handleAnswerChange}
          onRetry={quiz.retryPage}
          onSpeechPlaybackErrorChange={handleSpeechPlaybackErrorChange}
          onSpeechInputErrorChange={handleSpeechInputErrorChange}
        />
      </main>

      <section className="w-full max-w-[1100px] min-h-[14px] -mt-1 px-1">
        {speechPlaybackError && (
          <p className="text-[12px] font-semibold text-[#9a5a00] leading-tight">
            {speechPlaybackError}
          </p>
        )}
        {speechInputError && (
          <p className="text-[12px] font-semibold text-[#9a5a00] leading-tight">
            {speechInputError}
          </p>
        )}
      </section>

      <FireworksOverlay bursts={quiz.bursts} />
    </div>
  );
}
