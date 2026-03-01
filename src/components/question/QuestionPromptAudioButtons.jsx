import KeyboardShortcutHint from './KeyboardShortcutHint.jsx';

export default function QuestionPromptAudioButtons({
  disabled,
  vocabularyButtonLabel,
  exampleButtonLabel,
  onPlayVocabulary,
  onPlayExampleSentence,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 md:w-[170px] shrink-0">
      <button
        type="button"
        className="secondary px-3 text-sm whitespace-nowrap min-h-[46px] w-full"
        onClick={onPlayVocabulary}
        disabled={disabled}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span>{vocabularyButtonLabel}</span>
          <KeyboardShortcutHint shortcutKey="V" />
        </span>
      </button>

      <button
        type="button"
        className="secondary px-3 text-sm whitespace-nowrap min-h-[46px] w-full"
        onClick={onPlayExampleSentence}
        disabled={disabled}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span>{exampleButtonLabel}</span>
          <KeyboardShortcutHint shortcutKey="B" />
        </span>
      </button>
    </div>
  );
}
