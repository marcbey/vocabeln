import { useEffect, useRef } from 'react';
import { shouldHandleDesktopShortcutKeyDown } from '../../hooks/keyboard/desktopShortcuts.js';
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
  const microphoneShortcutPressedRef = useRef(false);
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
  const shortcutConfigRef = useRef({
    disableSubmit,
    disableShowSolution,
    showingSolution,
    speechDisabled,
    onSubmit,
    onShowSolution,
    startRecording,
    stopRecording,
  });

  useEffect(() => {
    shortcutConfigRef.current = {
      disableSubmit,
      disableShowSolution,
      showingSolution,
      speechDisabled,
      onSubmit,
      onShowSolution,
      startRecording,
      stopRecording,
    };
  }, [
    disableShowSolution,
    disableSubmit,
    onShowSolution,
    onSubmit,
    showingSolution,
    speechDisabled,
    startRecording,
    stopRecording,
  ]);

  useEffect(() => {
    const releaseMicrophoneShortcut = () => {
      if (!microphoneShortcutPressedRef.current) {
        return;
      }

      microphoneShortcutPressedRef.current = false;
      shortcutConfigRef.current.stopRecording();
    };

    const handleShortcutKeyDown = (event) => {
      if (!shouldHandleDesktopShortcutKeyDown(event)) {
        return;
      }

      const shortcutConfig = shortcutConfigRef.current;
      const key = event.key.toLowerCase();

      if (key === 'm') {
        if (
          event.repeat ||
          shortcutConfig.speechDisabled ||
          microphoneShortcutPressedRef.current
        ) {
          return;
        }

        event.preventDefault();
        microphoneShortcutPressedRef.current = true;
        shortcutConfig.startRecording();
        return;
      }

      if (event.repeat) {
        return;
      }

      if (key === 'c' && !shortcutConfig.disableSubmit) {
        event.preventDefault();
        shortcutConfig.onSubmit();
        return;
      }

      if (
        key === 'l' &&
        !shortcutConfig.showingSolution &&
        !shortcutConfig.disableShowSolution
      ) {
        event.preventDefault();
        shortcutConfig.onShowSolution();
        return;
      }

      if (
        key === 'w' &&
        shortcutConfig.showingSolution &&
        !shortcutConfig.disableShowSolution
      ) {
        event.preventDefault();
        shortcutConfig.onShowSolution();
      }
    };

    const handleShortcutKeyUp = (event) => {
      if (event.key.toLowerCase() !== 'm') {
        return;
      }

      if (!microphoneShortcutPressedRef.current) {
        return;
      }

      event.preventDefault();
      releaseMicrophoneShortcut();
    };

    window.addEventListener('keydown', handleShortcutKeyDown);
    window.addEventListener('keyup', handleShortcutKeyUp);
    window.addEventListener('blur', releaseMicrophoneShortcut);

    return () => {
      window.removeEventListener('keydown', handleShortcutKeyDown);
      window.removeEventListener('keyup', handleShortcutKeyUp);
      window.removeEventListener('blur', releaseMicrophoneShortcut);
      releaseMicrophoneShortcut();
    };
  }, []);

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
