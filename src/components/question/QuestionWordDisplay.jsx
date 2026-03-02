export default function QuestionWordDisplay({ questionText }) {
  return (
    <div className="flex-1 min-w-0 md:flex">
      <span className="flex w-full min-h-[2.3em] items-center justify-center text-center text-[2rem] md:text-[2.55rem] font-black leading-[1.04] px-3 py-2 rounded-xl border border-accent/40 bg-gradient-to-r from-accent/16 to-accent2/18 shadow-[0_0_0_1px_rgba(33,121,255,0.22)] break-words md:h-full md:min-h-0">
        {questionText}
      </span>
    </div>
  );
}
