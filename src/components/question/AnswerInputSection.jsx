import classNames from 'classnames';
import QuestionActions from './QuestionActions.jsx';

export default function AnswerInputSection({
  inputRef,
  value,
  status,
  isIrregular,
  disableSubmit,
  disableShowSolution,
  showingSolution,
  onChange,
  onSubmit,
  onShowSolution,
}) {
  return (
    <div className="flex flex-wrap md:flex-nowrap gap-3 items-stretch mt-2 md:items-center">
      <div className="relative flex-1 min-w-[240px]">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={
            isIrregular
              ? 'Infinitive, Simple Past, Past Participle'
              : 'Deine Antwort...'
          }
          className="w-full pr-14 py-4.5 text-xl font-semibold rounded-2xl shadow-glow border-2 border-white/20 bg-[#0f1f33]/90 focus:ring-2 focus:ring-accent focus:border-accent"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSubmit();
            }
          }}
          onChange={(event) => onChange(event.target.value)}
          disabled={disableSubmit || showingSolution}
        />

        <span
          className={classNames(
            'absolute right-3 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none font-extrabold transition-opacity duration-200',
            {
              'opacity-100 text-good': status === 'correct',
              'opacity-100 text-[#ff8585]': status === 'wrong',
            }
          )}
        >
          {status === 'correct' ? '✓' : status === 'wrong' ? '✗' : ''}
        </span>
      </div>

      <QuestionActions
        showingSolution={showingSolution}
        disableSubmit={disableSubmit}
        disableShowSolution={disableShowSolution}
        onSubmit={onSubmit}
        onShowSolution={onShowSolution}
        className="hidden md:flex gap-3 w-full md:w-auto md:items-center md:justify-end"
      />
    </div>
  );
}
