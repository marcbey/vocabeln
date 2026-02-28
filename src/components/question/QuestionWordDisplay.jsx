export default function QuestionWordDisplay({ questionText, questionLanguageLabel }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="m-0 mb-1 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
        Wort ({questionLanguageLabel})
      </p>

      <span className="inline-flex max-w-full items-center text-left text-[2rem] md:text-[2.55rem] font-black leading-[1.04] px-3 py-2 rounded-xl border border-accent/40 bg-gradient-to-r from-accent/16 to-accent2/18 shadow-[0_0_0_1px_rgba(33,121,255,0.22)] break-words">
        {questionText}
      </span>
    </div>
  );
}
