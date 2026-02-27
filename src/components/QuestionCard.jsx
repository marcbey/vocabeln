import classNames from 'classnames';
import ProgressBadge from './ProgressBadge.jsx';
import AnswerInputSection from './question/AnswerInputSection.jsx';
import BoardModeControls from './question/BoardModeControls.jsx';
import QuestionMobileFooter from './question/QuestionMobileFooter.jsx';
import QuestionPrompt from './question/QuestionPrompt.jsx';
import RetryButton from './question/RetryButton.jsx';

export default function QuestionCard({
  questionText,
  translation,
  showingSolution,
  boardMode,
  pageComplete,
  flashClass,
  status,
  isIrregular,
  currentWord,
  answerValue,
  inputRef,
  counts,
  onSubmit,
  onShowSolution,
  onBoardResult,
  onAnswerChange,
  onRetry,
}) {
  const showTranslation = showingSolution || boardMode;
  const disableSubmit = boardMode || showingSolution || !currentWord;
  const disableShowSolution = boardMode || !currentWord;

  return (
    <section
      className={classNames(
        'bg-panel/90 border border-white/10 rounded-xl2 p-5 shadow-deep relative overflow-hidden flex flex-col',
        flashClass
      )}
    >
      <QuestionPrompt
        questionText={questionText}
        translation={translation}
        showTranslation={showTranslation}
      />

      {!pageComplete && !boardMode && (
        <AnswerInputSection
          inputRef={inputRef}
          value={answerValue}
          status={status}
          isIrregular={isIrregular}
          disableSubmit={disableSubmit}
          disableShowSolution={disableShowSolution}
          showingSolution={showingSolution}
          onChange={onAnswerChange}
          onSubmit={onSubmit}
          onShowSolution={onShowSolution}
        />
      )}

      {!pageComplete && boardMode && (
        <BoardModeControls onBoardResult={onBoardResult} />
      )}

      {pageComplete && <RetryButton onRetry={onRetry} />}

      <div className="hidden md:flex mt-3 items-center justify-end">
        <ProgressBadge counts={counts} />
      </div>

      <QuestionMobileFooter
        counts={counts}
        pageComplete={pageComplete}
        boardMode={boardMode}
        showingSolution={showingSolution}
        disableSubmit={disableSubmit}
        disableShowSolution={disableShowSolution}
        onSubmit={onSubmit}
        onShowSolution={onShowSolution}
      />
    </section>
  );
}
