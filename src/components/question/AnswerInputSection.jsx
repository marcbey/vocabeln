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
    <div className="mt-1 grid gap-3 md:flex md:items-center">
      <div className="relative flex-1 min-w-0">
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
            'w-full pr-12 py-3.5 md:py-4 text-[1.15rem] md:text-[1.3rem] font-bold rounded-[18px] border-2 border-[#3f567e] bg-white focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 shadow-[0_8px_20px_rgba(33,121,255,0.12)]',
            {
              'border-good/70 bg-[rgba(23,164,109,0.10)] shadow-[0_0_0_3px_rgba(23,164,109,0.24)]':
                status === 'correct',
              'border-[#c62828] bg-[rgba(198,40,40,0.10)] shadow-[0_0_0_3px_rgba(198,40,40,0.22)]':
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
            'absolute right-3 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none font-black text-xl transition-opacity duration-200',
            {
              'opacity-100 text-good': status === 'correct',
              'opacity-100 text-[#c62828]': status === 'wrong',
            }
          )}
        >
          {status === 'correct' ? '✓' : status === 'wrong' ? '✗' : ''}
        </span>
      </div>

      <button
        type="button"
        className={classNames('secondary w-full md:w-[148px] px-4 py-3 whitespace-nowrap min-h-[52px]', {
          'ring-2 ring-accent2 text-[#7b3700] border-accent2 bg-[#fff5e9]': isRecording,
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
