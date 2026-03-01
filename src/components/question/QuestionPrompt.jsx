import { useEffect } from 'react';
import { useSolutionRevealFlash } from '../../hooks/question/useSolutionRevealFlash.js';
import { shouldHandleDesktopShortcutKeyDown } from '../../hooks/keyboard/desktopShortcuts.js';
import { useSpeechPlayback } from '../../hooks/audio/useSpeechPlayback.js';
import QuestionPromptAudioButtons from './QuestionPromptAudioButtons.jsx';
import QuestionTranslationRow from './QuestionTranslationRow.jsx';
import QuestionWordDisplay from './QuestionWordDisplay.jsx';

export default function QuestionPrompt({
  questionText,
  questionLanguage,
  canSpeak,
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

  const disabled = !canSpeak || isLoading;
  const isVocabularyActive = activePlaybackType === 'vocabulary';
  const isExampleActive = activePlaybackType === 'example';
  const questionLanguageLabel = questionLanguage === 'de' ? 'Deutsch' : 'Englisch';
  const solutionRevealFlash = useSolutionRevealFlash({
    showingSolution,
    translation,
  });

  const vocabularyButtonLabel = isVocabularyActive
    ? isLoading
      ? 'Lade Audio...'
      : isPlaying
        ? 'Spielt...'
        : 'Vorlesen'
    : 'Vorlesen';

  const exampleButtonLabel = isExampleActive
    ? isLoading
      ? 'Lade Satz...'
      : isPlaying
        ? 'Spielt Satz...'
        : 'Beispielsatz'
    : 'Beispielsatz';

  useEffect(() => {
    onSpeechPlaybackErrorChange?.(error);
  }, [error, onSpeechPlaybackErrorChange]);

  useEffect(() => {
    const handleShortcutKeyDown = (event) => {
      if (event.repeat || !shouldHandleDesktopShortcutKeyDown(event) || disabled) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'v') {
        event.preventDefault();
        playVocabulary({
          text: questionText,
          language: questionLanguage,
        });
      }

      if (key === 'b') {
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
    disabled,
    playVocabulary,
    playExampleSentence,
    questionLanguage,
    questionText,
  ]);

  return (
    <div className="mt-1 mb-3 px-3 py-3 md:px-4 md:py-4 bg-[#e0e9f8] border-2 border-[#3f567e] rounded-xl2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] flex flex-col gap-3">
      <div className="w-full flex flex-col gap-3 md:flex-row md:items-start">
        <QuestionWordDisplay
          questionText={questionText}
          questionLanguageLabel={questionLanguageLabel}
        />

        <QuestionPromptAudioButtons
          disabled={disabled}
          vocabularyButtonLabel={vocabularyButtonLabel}
          exampleButtonLabel={exampleButtonLabel}
          onPlayVocabulary={() =>
            playVocabulary({
              text: questionText,
              language: questionLanguage,
            })
          }
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
