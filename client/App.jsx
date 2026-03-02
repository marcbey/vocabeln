import { useCallback, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import FireworksOverlay from './components/FireworksOverlay.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import SpeechErrorMessages from './components/SpeechErrorMessages.jsx';
import {
  CLASS_DATASETS,
  CLASS_OPTIONS,
  DEFAULT_CLASS_ID,
} from './data/index.js';
import { useActiveClassId } from './hooks/useActiveClassId.js';
import { useMainMobileAutoScroll } from './hooks/useMainMobileAutoScroll.js';
import { useQuizController } from './hooks/useQuizController.js';

const CLASS_IDS = CLASS_OPTIONS.map((item) => item.id);

export default function App() {
  const [activeClassId, setActiveClassId] = useActiveClassId({
    allowedClassIds: CLASS_IDS,
    defaultClassId: DEFAULT_CLASS_ID,
  });

  const activeClass = useMemo(
    () =>
      CLASS_OPTIONS.find((item) => item.id === activeClassId) ?? CLASS_OPTIONS[0],
    [activeClassId]
  );

  const activeDataset = CLASS_DATASETS[activeClassId] ?? CLASS_DATASETS[DEFAULT_CLASS_ID];
  const [speechPlaybackError, setSpeechPlaybackError] = useState('');
  const [speechInputError, setSpeechInputError] = useState('');
  const mainRef = useRef(null);
  const { handleMainPointerDownCapture, handleMainKeyDownCapture } =
    useMainMobileAutoScroll(mainRef);

  const quiz = useQuizController({
    classId: activeClassId,
    vocabData: activeDataset.vocabData,
    irregularData: activeDataset.irregularData,
    unitPages: activeDataset.unitPages,
  });

  const handleSpeechPlaybackErrorChange = useCallback((nextError) => {
    setSpeechPlaybackError(nextError || '');
  }, []);

  const handleSpeechInputErrorChange = useCallback((nextError) => {
    setSpeechInputError(nextError || '');
  }, []);

  return (
    <>
      <div className="app-shell flex w-full flex-col items-center gap-4 md:gap-5">
        <Header
          headline={activeClass.headline}
          activeClassId={activeClassId}
          classOptions={CLASS_OPTIONS}
          filterMode={quiz.filterMode}
          pages={quiz.pages}
          page={quiz.page}
          units={quiz.units}
          unit={quiz.unit}
          direction={quiz.direction}
          boardMode={quiz.boardMode}
          completedPages={quiz.completedPages}
          completedUnits={quiz.completedUnits}
          isIrregular={quiz.isIrregular}
          onClassChange={setActiveClassId}
          onFilterModeChange={quiz.changeFilterMode}
          onPageChange={quiz.changePage}
          onUnitChange={quiz.changeUnit}
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

        <SpeechErrorMessages
          playbackError={speechPlaybackError}
          inputError={speechInputError}
        />

        <FireworksOverlay bursts={quiz.bursts} />
      </div>

      <section className="landscape-blocker" aria-live="polite">
        <div className="landscape-blocker-card">
          <p>Bitte Geraet drehen</p>
          <p className="landscape-blocker-copy">
            Diese App ist im Querformat auf dem Handy deaktiviert. Bitte ins
            Hochformat wechseln.
          </p>
        </div>
      </section>
    </>
  );
}
