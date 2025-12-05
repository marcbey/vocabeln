import React from 'react';
import classNames from 'classnames';
import ProgressBadge from './ProgressBadge.jsx';

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
  inputRef,
  counts,
  onSubmit,
  onShowSolution,
  onBoardResult,
  onInputChange,
  onRetry,
}) {
  const showTranslation = showingSolution || boardMode;
  const disableSubmit = boardMode || showingSolution || !currentWord;

  return (
    <section className={classNames('bg-panel/90 border border-white/10 rounded-xl2 p-5 shadow-deep relative overflow-hidden flex flex-col', flashClass)}>
      <div className="text-2xl font-extrabold mt-2 mb-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner flex flex-wrap gap-2 items-center text-center min-h-[86px]">
        <span className="flex items-center text-left">{questionText}</span>
        <span className={classNames('text-muted font-bold inline-flex items-center gap-1 transition-opacity duration-200', { 'opacity-100 visible': showTranslation, 'opacity-0 invisible': !showTranslation })}>
          →
        </span>
        <span className={classNames('text-lg text-muted px-3 py-1 rounded-lg border border-dashed border-white/20 bg-white/5 inline-flex items-center gap-2 transition-opacity duration-200', { 'opacity-100 visible': showTranslation, 'opacity-0 invisible': !showTranslation })}>
          {translation}
        </span>
      </div>

      {!pageComplete && !boardMode && (
        <div className="flex flex-wrap md:flex-nowrap gap-3 items-stretch mt-2 md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <input
              ref={inputRef}
              type="text"
              placeholder={isIrregular ? 'Infinitive, Simple Past, Past Participle' : 'Deine Antwort...'}
              className="w-full pr-14 py-4.5 text-xl font-semibold rounded-2xl shadow-glow border-2 border-white/20 bg-[#0f1f33]/90 focus:ring-2 focus:ring-accent focus:border-accent"
              onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
              onInput={onInputChange}
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
            <button className="px-4 whitespace-nowrap" onClick={onSubmit} disabled={disableSubmit}>Check!</button>
            <button className="secondary px-4 whitespace-nowrap" onClick={onShowSolution} disabled={boardMode || !currentWord}>
              {showingSolution ? 'Weiter' : 'Lösung zeigen'}
            </button>
          </div>
        </div>
      )}

      {!pageComplete && boardMode && (
        <div className="flex flex-wrap gap-3 mt-3">
          <button className="flex-1 min-w-[140px] bg-gradient-to-r from-good to-[#8ef7be] text-[#063621]" onClick={() => onBoardResult(true)}>
            ✓ Richtig
          </button>
          <button className="flex-1 min-w-[140px] bg-gradient-to-r from-[#ff8585] to-[#ffb4b4] text-[#3a0d0d]" onClick={() => onBoardResult(false)}>
            ✗ Falsch
          </button>
        </div>
      )}

      {pageComplete && (
        <button className="retry-btn mt-3 w-full bg-gradient-to-r from-accent2 to-accent text-[#031524] font-extrabold py-3 rounded-xl" onClick={onRetry}>
          Diese Seite nochmal üben
        </button>
      )}

      <div className="hidden md:flex mt-3 items-center justify-end">
        <ProgressBadge counts={counts} />
      </div>

      <div className="md:hidden mt-3 flex flex-wrap sm:flex-nowrap items-center gap-3 justify-between">
        <ProgressBadge counts={counts} className="order-2 sm:order-1 w-full sm:w-auto" />
        {!pageComplete && !boardMode && (
          <div className="flex gap-3 ml-auto order-1 sm:order-2 w-full sm:w-auto justify-end">
            <button className="px-4 whitespace-nowrap" onClick={onSubmit} disabled={disableSubmit}>Check!</button>
            <button className="secondary px-4 whitespace-nowrap" onClick={onShowSolution} disabled={boardMode || !currentWord}>
              {showingSolution ? 'Weiter' : 'Lösung zeigen'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
