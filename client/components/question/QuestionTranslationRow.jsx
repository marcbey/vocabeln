import classNames from 'classnames';

export default function QuestionTranslationRow({
  showTranslation,
  translation,
  solutionRevealFlash,
}) {
  return (
    <div className="w-full flex flex-col gap-2 items-start md:flex-row md:items-center">
      <span className="text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
        Übersetzung
      </span>
      <span
        className={classNames(
          'text-base md:text-lg text-text px-3 py-1.5 rounded-lg border-2 border-dashed border-[#3f567e] bg-white inline-flex items-center gap-2 transition-all duration-200 min-h-[38px] w-full md:w-auto justify-center md:justify-start text-center md:text-left',
          {
            'font-bold': showTranslation,
            'text-muted': !showTranslation,
            'solution-reveal-flash border-[#0d47b7]': solutionRevealFlash,
          }
        )}
      >
        {showTranslation ? translation : 'Wird nach dem Check eingeblendet'}
      </span>
    </div>
  );
}
