import Header from './components/Header.jsx';
import FireworksOverlay from './components/FireworksOverlay.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import { irregularData, vocabData } from './data/index.js';
import { useQuizController } from './hooks/useQuizController.js';

export default function App() {
  const quiz = useQuizController({
    vocabData,
    irregularData,
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <Header
        pages={quiz.pages}
        page={quiz.page}
        direction={quiz.direction}
        boardMode={quiz.boardMode}
        completedPages={quiz.completedPages}
        isIrregular={quiz.isIrregular}
        onPageChange={quiz.changePage}
        onDirectionChange={quiz.changeDirection}
        onToggleBoardMode={quiz.toggleBoardMode}
        onReset={quiz.resetAll}
      />

      <main className="w-full max-w-[1100px] grid grid-cols-1 gap-4">
        <QuestionCard
          questionText={quiz.questionText}
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
          onShowSolution={quiz.showOrAdvanceSolution}
          onBoardResult={quiz.applyBoardResult}
          onAnswerChange={quiz.handleAnswerChange}
          onRetry={quiz.retryPage}
        />
      </main>

      <FireworksOverlay bursts={quiz.bursts} />
    </div>
  );
}
