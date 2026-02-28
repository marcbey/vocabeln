import classNames from 'classnames';

export default function SpeechInputButton({
  isRecording,
  isSubmitting,
  disabled,
  onStartRecording,
  onStopRecording,
}) {
  const label = isRecording
    ? 'Aufnahme...'
    : isSubmitting
      ? 'Pruefe...'
      : 'Mikrofon';

  const handlePointerDown = (event) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onStartRecording();
  };

  const handlePointerUp = (event) => {
    event.preventDefault();
    onStopRecording();

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !disabled) {
      event.preventDefault();
      onStartRecording();
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onStopRecording();
    }
  };

  return (
    <button
      type="button"
      className={classNames(
        'secondary w-full md:w-[148px] px-4 py-3 whitespace-nowrap min-h-[52px] no-touch-text-select',
        {
          'ring-2 ring-accent2 text-[#7b3700] border-accent2 bg-[#fff5e9]': isRecording,
        }
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={onStopRecording}
      onPointerLeave={(event) => {
        if (!event.buttons) {
          onStopRecording();
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={disabled}
      aria-label="Spracheingabe starten"
    >
      {label}
    </button>
  );
}
