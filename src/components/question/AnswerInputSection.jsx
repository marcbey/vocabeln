import { useEffect } from 'react';
import { useSpeechInput } from '../../hooks/audio/useSpeechInput.js';
import AnswerTextInput from './AnswerTextInput.jsx';
import QuestionActions from './QuestionActions.jsx';
import SpeechInputButton from './SpeechInputButton.jsx';

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
  const inputDisabled = disableSubmit || showingSolution;

  return (
    <div className="mt-1 grid gap-3 md:flex md:items-center">
      <AnswerTextInput
        inputRef={inputRef}
        value={value}
        status={status}
        isIrregular={isIrregular}
        disabled={inputDisabled}
        onSubmit={onSubmit}
        onChange={onChange}
      />

      <SpeechInputButton
        isRecording={isRecording}
        isSubmitting={isSubmitting}
        disabled={speechDisabled}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

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
