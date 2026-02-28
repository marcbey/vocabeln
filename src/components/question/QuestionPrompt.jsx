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

  return (
    <div className="mt-1 mb-3 px-3 py-3 md:px-4 md:py-4 bg-[#e0e9f8] border-2 border-[#3f567e] rounded-xl2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] flex flex-col gap-3">
      <div className="w-full flex flex-col gap-3 md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          <p className="m-0 mb-1 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
            Wort ({questionLanguageLabel})
          </p>
          <span className="inline-flex max-w-full items-center text-left text-[2rem] md:text-[2.55rem] font-black leading-[1.04] px-3 py-2 rounded-xl border border-accent/40 bg-gradient-to-r from-accent/16 to-accent2/18 shadow-[0_0_0_1px_rgba(33,121,255,0.22)] break-words">
            {questionText}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 md:w-[170px] shrink-0">
          <button
            type="button"
            className="secondary px-3 text-sm whitespace-nowrap min-h-[46px] w-full"
            onClick={() =>
              playVocabulary({
                text: questionText,
                language: questionLanguage,
              })
            }
            disabled={disabled}
          >
            {vocabularyButtonLabel}
          </button>

          <button
            type="button"
            className="secondary px-3 text-sm whitespace-nowrap min-h-[46px] w-full"
            onClick={() =>
              playExampleSentence({
                text: questionText,
                language: questionLanguage,
              })
            }
            disabled={disabled}
          >
            {exampleButtonLabel}
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2 items-start md:flex-row md:items-center">
        <span className="text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
          Üebersetzung
        </span>
        <span
          className={classNames(
            'text-base md:text-lg text-text px-3 py-1.5 rounded-lg border-2 border-dashed border-[#3f567e] bg-white inline-flex items-center gap-2 transition-all duration-200 min-h-[38px] w-full md:w-auto justify-center md:justify-start text-center md:text-left',
            {
              'font-bold': showTranslation,
              'text-muted': !showTranslation,
            }
          )}
        >
          {showTranslation ? translation : 'Wird nach dem Check eingeblendet'}
        </span>
      </div>
    </div>
  );
}
