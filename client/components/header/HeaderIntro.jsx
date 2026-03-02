export default function HeaderIntro({ headline }) {
  return (
    <div className="min-w-0 shrink">
      <h1 className="m-0 text-lg md:text-2xl tracking-tight flex items-center gap-2 font-extrabold min-w-0">
        <span
          className="w-4 h-4 rounded-full inline-block shrink-0"
          style={{
            background: 'linear-gradient(135deg, #2179ff, #ff9f1c)',
            boxShadow: '0 0 0 4px rgba(33, 121, 255, 0.18)',
          }}
        />
        <span className="truncate">{headline}</span>
      </h1>

      <p className="mt-1 text-[13px] md:text-[14px] text-muted font-semibold">
        Jede Runde macht dich besser und fit für die nächste Englischarbeit.
      </p>
    </div>
  );
}
