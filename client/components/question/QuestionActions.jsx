import classNames from 'classnames';
import KeyboardShortcutHint from './KeyboardShortcutHint.jsx';

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
          'px-4 md:px-5 whitespace-nowrap min-h-[50px] w-full md:w-auto no-touch-text-select',
          { secondary: showingSolution }
        )}
        onClick={onSubmit}
        disabled={disableSubmit}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span>Check!</span>
          <KeyboardShortcutHint shortcutKey="C" />
        </span>
      </button>
      <button
        type="button"
        className={classNames(
          'px-4 md:px-5 whitespace-nowrap min-h-[50px] w-full md:w-auto no-touch-text-select',
          { secondary: !showingSolution }
        )}
        onClick={onShowSolution}
        disabled={disableShowSolution}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span>{showingSolution ? 'Weiter' : 'Lösung zeigen'}</span>
          <KeyboardShortcutHint shortcutKey={showingSolution ? 'W' : 'L'} />
        </span>
      </button>
    </div>
  );
}
