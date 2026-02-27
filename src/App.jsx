import { useCallback, useEffect, useMemo, useState } from 'react';
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

  return (
    <div className="flex flex-col items-center gap-5">
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

      <main className="w-full max-w-[1100px] grid grid-cols-1 gap-4">
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

      <section className="w-full max-w-[1100px] min-h-[14px] -mt-2">
        {speechPlaybackError && (
          <p className="text-[11px] text-muted/80 leading-tight">
            {speechPlaybackError}
          </p>
        )}
        {speechInputError && (
          <p className="text-[11px] text-muted/80 leading-tight">{speechInputError}</p>
        )}
      </section>

      <FireworksOverlay bursts={quiz.bursts} />
    </div>
  );
}
