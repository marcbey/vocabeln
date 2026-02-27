import classNames from 'classnames';
import { useEffect } from 'react';
import { useSpeechInput } from '../../hooks/audio/useSpeechInput.js';
import QuestionActions from './QuestionActions.jsx';

export default function AnswerInputSection({
  inputRef,
  value,
  status,
  isIrregular,
  answerLanguage,
  disableSubmit,
  disableShowSolution,
  showingSolution,
  onChange,
  onSubmit,
  onSubmitSpokenAnswer,
  onShowSolution,
  onSpeechInputErrorChange,
}) {
  const { isRecording, isSubmitting, error, startRecording, stopRecording } =
    useSpeechInput({
      language: answerLanguage,
      onAnswerReady: onSubmitSpokenAnswer,
    });

  useEffect(() => {
    onSpeechInputErrorChange?.(error);
  }, [error, onSpeechInputErrorChange]);

  const speechDisabled = disableSubmit || showingSolution || isSubmitting;

  const handleMicPointerDown = (event) => {
    if (speechDisabled) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startRecording();
  };

  const handleMicPointerUp = (event) => {
    event.preventDefault();
    stopRecording();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleMicKeyDown = (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !speechDisabled) {
      event.preventDefault();
      startRecording();
    }
  };

  const handleMicKeyUp = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      stopRecording();
    }
  };

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
          className={classNames(
            'w-full pr-14 py-4.5 text-xl font-semibold rounded-2xl shadow-glow border-2 border-white/20 bg-[#0f1f33]/90 focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200',
            {
              'border-good/80 bg-[rgba(109,242,164,0.10)] shadow-[0_0_0_2px_rgba(109,242,164,0.40)]':
                status === 'correct',
              'border-[#ff8585]/80 bg-[rgba(255,133,133,0.10)] shadow-[0_0_0_2px_rgba(255,133,133,0.40)]':
                status === 'wrong',
            }
          )}
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

      <button
        type="button"
        className={classNames('secondary px-4 py-3 whitespace-nowrap', {
          'ring-1 ring-accent2/40 text-accent2': isRecording,
        })}
        onPointerDown={handleMicPointerDown}
        onPointerUp={handleMicPointerUp}
        onPointerCancel={stopRecording}
        onPointerLeave={(event) => {
          if (!event.buttons) {
            stopRecording();
          }
        }}
        onKeyDown={handleMicKeyDown}
        onKeyUp={handleMicKeyUp}
        disabled={speechDisabled}
        aria-label="Spracheingabe starten"
      >
        {isRecording ? 'Aufnahme...' : isSubmitting ? 'Pruefe...' : 'Mikrofon'}
      </button>

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
