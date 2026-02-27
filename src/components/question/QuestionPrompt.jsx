import classNames from 'classnames';
import { useEffect } from 'react';
import { useSpeechPlayback } from '../../hooks/audio/useSpeechPlayback.js';

export default function QuestionPrompt({
  questionText,
  questionLanguage,
  canSpeak,
  translation,
  showTranslation,
  onSpeechPlaybackErrorChange,
}) {
  const { isLoading, isPlaying, error, playVocabulary } = useSpeechPlayback();

  const disabled = !canSpeak || isLoading;

  useEffect(() => {
    onSpeechPlaybackErrorChange?.(error);
  }, [error, onSpeechPlaybackErrorChange]);

  return (
    <div className="text-2xl font-extrabold mt-2 mb-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner flex flex-wrap gap-2 items-center text-center min-h-[86px]">
      <span className="flex items-center text-left flex-1">{questionText}</span>

      <button
        type="button"
        className="secondary px-3 py-2 text-sm whitespace-nowrap"
        onClick={() =>
          playVocabulary({
            text: questionText,
            language: questionLanguage,
          })
        }
        disabled={disabled}
      >
        {isLoading ? 'Lade Audio...' : isPlaying ? 'Spielt...' : 'Vorlesen'}
      </button>

      <span
        className={classNames(
          'text-muted font-bold inline-flex items-center gap-1 transition-opacity duration-200',
          {
            'opacity-100 visible': showTranslation,
            'opacity-0 invisible': !showTranslation,
          }
        )}
      >
        →
      </span>

      <span
        className={classNames(
          'text-lg text-muted px-3 py-1 rounded-lg border border-dashed border-white/20 bg-white/5 inline-flex items-center gap-2 transition-opacity duration-200',
          {
            'opacity-100 visible': showTranslation,
            'opacity-0 invisible': !showTranslation,
          }
        )}
      >
        {translation}
      </span>
    </div>
  );
}
