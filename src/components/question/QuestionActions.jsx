import classNames from 'classnames';

export default function QuestionActions({
  showingSolution,
  disableSubmit,
  disableShowSolution,
  className,
  onSubmit,
  onShowSolution,
}) {
  return (
    <div className={className}>
      <button
        type="button"
        className={classNames(
          'px-4 md:px-5 whitespace-nowrap min-h-[50px] w-full md:w-[120px]',
          { secondary: showingSolution }
        )}
        onClick={onSubmit}
        disabled={disableSubmit}
      >
        Check!
      </button>
      <button
        type="button"
        className={classNames(
          'px-4 md:px-5 whitespace-nowrap min-h-[50px] w-full md:w-[170px]',
          { secondary: !showingSolution }
        )}
        onClick={onShowSolution}
        disabled={disableShowSolution}
      >
        {showingSolution ? 'Weiter' : 'Lösung zeigen'}
      </button>
    </div>
  );
}
