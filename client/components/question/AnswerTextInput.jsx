import classNames from 'classnames';

const IRREGULAR_PLACEHOLDER = 'Infinitive, Simple Past, Past Participle';
const REGULAR_PLACEHOLDER = 'Deine Antwort...';

export default function AnswerTextInput({
  inputRef,
  value,
  status,
  isIrregular,
  disabled,
  onSubmit,
  onChange,
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={isIrregular ? IRREGULAR_PLACEHOLDER : REGULAR_PLACEHOLDER}
        className={classNames(
          'w-full pr-12 py-3.5 md:py-4 text-[1.15rem] md:text-[1.3rem] font-bold rounded-[18px] border-2 border-[#3f567e] bg-white focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 shadow-[0_8px_20px_rgba(33,121,255,0.12)]',
          {
            'border-[#0b7a4f] bg-[rgba(11,122,79,0.18)] shadow-[0_0_0_4px_rgba(11,122,79,0.34),0_10px_24px_rgba(11,122,79,0.22)] scale-[1.01]':
              status === 'correct',
            'border-[#b91c1c] bg-[rgba(185,28,28,0.16)] shadow-[0_0_0_4px_rgba(185,28,28,0.34),0_10px_24px_rgba(185,28,28,0.20)] scale-[1.01]':
              status === 'wrong',
          }
        )}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSubmit();
          }
        }}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />

      <span
        className={classNames(
          'absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none font-black text-lg transition-all duration-200 rounded-full w-8 h-8 inline-flex items-center justify-center',
          {
            'opacity-100 text-white bg-[#0b7a4f] scale-110': status === 'correct',
            'opacity-100 text-white bg-[#b91c1c] scale-110': status === 'wrong',
          }
        )}
      >
        {status === 'correct' ? '✓' : status === 'wrong' ? '✗' : ''}
      </span>
    </div>
  );
}
