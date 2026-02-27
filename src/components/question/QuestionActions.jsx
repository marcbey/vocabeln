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
        className="px-4 whitespace-nowrap"
        onClick={onSubmit}
        disabled={disableSubmit}
      >
        Check!
      </button>
      <button
        type="button"
        className="secondary px-4 whitespace-nowrap"
        onClick={onShowSolution}
        disabled={disableShowSolution}
      >
        {showingSolution ? 'Weiter' : 'Lösung zeigen'}
      </button>
    </div>
  );
}
