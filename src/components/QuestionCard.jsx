import classNames from 'classnames';
import ProgressBadge from './ProgressBadge.jsx';
import AnswerInputSection from './question/AnswerInputSection.jsx';
import BoardModeControls from './question/BoardModeControls.jsx';
import QuestionMobileFooter from './question/QuestionMobileFooter.jsx';
import QuestionPrompt from './question/QuestionPrompt.jsx';
import RetryButton from './question/RetryButton.jsx';

export default function QuestionCard({
  questionText,
  questionLanguage,
  answerLanguage,
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
  onSubmitSpokenAnswer,
  onShowSolution,
  onBoardResult,
  onAnswerChange,
  onRetry,
  onSpeechPlaybackErrorChange,
  onSpeechInputErrorChange,
}) {
  const showTranslation = showingSolution || boardMode;
  const disableSubmit = boardMode || showingSolution || !currentWord;
  const disableShowSolution = boardMode || !currentWord;

  return (
    <section
      className={classNames(
        'bg-white border-2 border-[#3f567e] rounded-xl2 p-4 md:p-5 shadow-deep relative overflow-hidden flex flex-col',
        flashClass
      )}
    >
      <QuestionPrompt
        questionText={questionText}
        questionLanguage={questionLanguage}
        canSpeak={Boolean(currentWord)}
        translation={translation}
        showTranslation={showTranslation}
        onSpeechPlaybackErrorChange={onSpeechPlaybackErrorChange}
      />

      {!pageComplete && !boardMode && (
        <AnswerInputSection
          inputRef={inputRef}
          value={answerValue}
          status={status}
          isIrregular={isIrregular}
          answerLanguage={answerLanguage}
          disableSubmit={disableSubmit}
          disableShowSolution={disableShowSolution}
          showingSolution={showingSolution}
          onChange={onAnswerChange}
          onSubmit={onSubmit}
          onSubmitSpokenAnswer={onSubmitSpokenAnswer}
          onShowSolution={onShowSolution}
          onSpeechInputErrorChange={onSpeechInputErrorChange}
        />
      )}

      {!pageComplete && boardMode && (
        <BoardModeControls onBoardResult={onBoardResult} />
      )}

      {pageComplete && <RetryButton onRetry={onRetry} />}

      <div className="hidden md:flex mt-4 items-center justify-end">
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
