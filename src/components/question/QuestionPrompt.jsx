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
    <div className="mt-2 mb-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner flex flex-col gap-2 min-h-[86px]">
      <div className="w-full flex items-center gap-2">
        <div className="flex-1">
          <span className="inline-flex items-center text-left text-3xl md:text-4xl font-black leading-tight px-3 py-2 rounded-xl border border-accent/45 bg-gradient-to-r from-accent/20 to-accent2/15 shadow-[0_0_0_1px_rgba(60,223,255,0.22)]">
            {questionText}
          </span>
        </div>

        <button
          type="button"
          className="secondary px-3 py-2 text-sm whitespace-nowrap ml-auto shrink-0"
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
      </div>

      <div className="w-full flex flex-wrap gap-2 items-center justify-center text-center">
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
    </div>
  );
}
