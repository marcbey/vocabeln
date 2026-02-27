import classNames from 'classnames';

export default function HeaderActions({ boardMode, onToggleBoardMode, onReset, fullWidth }) {
  return (
    <div className={classNames('flex gap-3 justify-end', { 'w-full': fullWidth })}>
      <button
        type="button"
        className={classNames('toggle px-4 py-2 rounded-xl border', {
          active: boardMode,
          'w-full': fullWidth,
        })}
        onClick={onToggleBoardMode}
      >
        Tafel-Modus
      </button>
      <button
        type="button"
        className={classNames('secondary px-4 py-2 rounded-xl border', {
          'w-full': fullWidth,
        })}
        onClick={onReset}
      >
        Neu anfangen
      </button>
    </div>
  );
}
