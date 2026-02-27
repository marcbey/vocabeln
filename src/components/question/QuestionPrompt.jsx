import classNames from 'classnames';

export default function QuestionPrompt({
  questionText,
  translation,
  showTranslation,
}) {
  return (
    <div className="text-2xl font-extrabold mt-2 mb-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner flex flex-wrap gap-2 items-center text-center min-h-[86px]">
      <span className="flex items-center text-left">{questionText}</span>

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
