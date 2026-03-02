export default function SpeechErrorMessages({ playbackError, inputError }) {
  return (
    <section className="w-full max-w-[1100px] min-h-[14px] -mt-1 px-1">
      {playbackError && (
        <p className="text-[12px] font-semibold text-[#9a5a00] leading-tight">
          {playbackError}
        </p>
      )}

      {inputError && (
        <p className="text-[12px] font-semibold text-[#9a5a00] leading-tight">
          {inputError}
        </p>
      )}
    </section>
  );
}
