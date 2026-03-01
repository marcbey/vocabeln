import { useCallback, useEffect, useRef, useState } from 'react';
import { useSolutionRevealFlash } from '../../hooks/question/useSolutionRevealFlash.js';
import {
  isShortcutModifierPressed,
  isLetterShortcutPressed,
  shouldHandleDesktopShortcutKeyDown,
} from '../../hooks/keyboard/desktopShortcuts.js';
import { useSpeechPlayback } from '../../hooks/audio/useSpeechPlayback.js';
import QuestionPromptAudioButtons from './QuestionPromptAudioButtons.jsx';
import QuestionTranslationRow from './QuestionTranslationRow.jsx';
import QuestionWordDisplay from './QuestionWordDisplay.jsx';

const READ_ALOUD_STORAGE_KEY = 'speech:autoReadEnabled';

function loadReadAloudEnabled() {
  try {
    return localStorage.getItem(READ_ALOUD_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveReadAloudEnabled(enabled) {
  try {
    localStorage.setItem(READ_ALOUD_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore storage write errors (private mode / blocked storage).
  }
}

export default function QuestionPrompt({
  questionText,
  questionLanguage,
  answerLanguage,
  canSpeak,
  status,
  translation,
  showingSolution,
  showTranslation,
  onSpeechPlaybackErrorChange,
}) {
  const {
    isLoading,
    isPlaying,
    activePlaybackType,
    error,
    playVocabulary,
    playExampleSentence,
  } = useSpeechPlayback();
  const [isReadAloudEnabled, setIsReadAloudEnabled] = useState(loadReadAloudEnabled);
  const previousShowingSolutionRef = useRef(showingSolution);
  const previousStatusRef = useRef(status);
  const skipNextQuestionReadRef = useRef(false);

  const exampleDisabled = !canSpeak || isLoading;
  const isExampleActive = activePlaybackType === 'example';
  const questionLanguageLabel = questionLanguage === 'de' ? 'Deutsch' : 'Englisch';
  const solutionRevealFlash = useSolutionRevealFlash({
    showingSolution,
    translation,
  });
  const readAloudButtonLabel = `Vorlesen: ${isReadAloudEnabled ? 'An' : 'Aus'}`;

  const exampleButtonLabel = isExampleActive
    ? isLoading
      ? 'Lade Satz...'
      : isPlaying
        ? 'Spielt Satz...'
        : 'Beispielsatz'
    : 'Beispielsatz';

  const playQuestion = useCallback(() => {
    if (!canSpeak || !questionText) {
      return;
    }

    playVocabulary({
      text: questionText,
      language: questionLanguage,
    });
  }, [canSpeak, playVocabulary, questionLanguage, questionText]);

  const playTranslation = useCallback(() => {
    if (!translation || !answerLanguage) {
      return;
    }

    playVocabulary({
      text: translation,
      language: answerLanguage,
    });
  }, [answerLanguage, playVocabulary, translation]);

  const toggleReadAloud = useCallback(() => {
    setIsReadAloudEnabled((current) => !current);
  }, []);

  useEffect(() => {
    saveReadAloudEnabled(isReadAloudEnabled);
  }, [isReadAloudEnabled]);

  useEffect(() => {
    onSpeechPlaybackErrorChange?.(error);
  }, [error, onSpeechPlaybackErrorChange]);

  useEffect(() => {
    if (!isReadAloudEnabled) {
      return;
    }

    if (skipNextQuestionReadRef.current) {
      skipNextQuestionReadRef.current = false;
      return;
    }

    playQuestion();
  }, [isReadAloudEnabled, playQuestion]);

  useEffect(() => {
    const wasShowingSolution = previousShowingSolutionRef.current;

    if (isReadAloudEnabled && !wasShowingSolution && showingSolution) {
      playTranslation();
    }

    previousShowingSolutionRef.current = showingSolution;
  }, [isReadAloudEnabled, playTranslation, showingSolution]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;

    if (isReadAloudEnabled && previousStatus !== 'correct' && status === 'correct') {
      // After a correct check, the next word is picked immediately. Skip that one
      // auto-read once so the revealed solution can be heard first.
      skipNextQuestionReadRef.current = true;
      playTranslation();
    }

    previousStatusRef.current = status;
  }, [isReadAloudEnabled, playTranslation, status]);

  useEffect(() => {
    const handleShortcutKeyDown = (event) => {
      if (
        event.repeat ||
        !shouldHandleDesktopShortcutKeyDown(event, {
          allowInEditable: true,
        })
      ) {
        return;
      }

      if (!isShortcutModifierPressed(event)) {
        return;
      }

      if (isLetterShortcutPressed(event, 'v')) {
        event.preventDefault();
        toggleReadAloud();
        return;
      }

      if (exampleDisabled) {
        return;
      }

      if (isLetterShortcutPressed(event, 'b') && canSpeak) {
        event.preventDefault();
        playExampleSentence({
          text: questionText,
          language: questionLanguage,
        });
      }
    };

    window.addEventListener('keydown', handleShortcutKeyDown);
    return () => {
      window.removeEventListener('keydown', handleShortcutKeyDown);
    };
  }, [
    canSpeak,
    exampleDisabled,
    playExampleSentence,
    questionLanguage,
    questionText,
    toggleReadAloud,
  ]);

  return (
    <div className="mt-1 mb-3 px-3 py-3 md:px-4 md:py-4 bg-[#e0e9f8] border-2 border-[#3f567e] rounded-xl2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] flex flex-col gap-3">
      <div className="w-full flex flex-col gap-3 md:flex-row md:items-start">
        <QuestionWordDisplay
          questionText={questionText}
          questionLanguageLabel={questionLanguageLabel}
        />

        <QuestionPromptAudioButtons
          exampleDisabled={exampleDisabled}
          isReadAloudEnabled={isReadAloudEnabled}
          readAloudButtonLabel={readAloudButtonLabel}
          exampleButtonLabel={exampleButtonLabel}
          onToggleReadAloud={toggleReadAloud}
          onPlayExampleSentence={() =>
            playExampleSentence({
              text: questionText,
              language: questionLanguage,
            })
          }
        />
      </div>

      <QuestionTranslationRow
        showTranslation={showTranslation}
        translation={translation}
        solutionRevealFlash={solutionRevealFlash}
      />
    </div>
  );
}
