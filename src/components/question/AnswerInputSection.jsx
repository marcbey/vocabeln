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
              'border-[#0b7a4f] bg-[rgba(11,122,79,0.18)] shadow-[0_0_0_4px_rgba(11,122,79,0.34),0_10px_24px_rgba(11,122,79,0.22)] scale-[1.01]':
                status === 'correct',
              'border-[#b91c1c] bg-[rgba(185,28,28,0.16)] shadow-[0_0_0_4px_rgba(185,28,28,0.34),0_10px_24px_rgba(185,28,28,0.20)] scale-[1.01]':
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
            'absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none font-black text-lg transition-all duration-200 rounded-full w-8 h-8 inline-flex items-center justify-center',
            {
              'opacity-100 text-white bg-[#0b7a4f] scale-110': status === 'correct',
              'opacity-100 text-white bg-[#b91c1c] scale-110': status === 'wrong',
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
