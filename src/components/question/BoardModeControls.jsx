export default function BoardModeControls({ onBoardResult }) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        type="button"
        className="w-full min-h-[56px] bg-gradient-to-r from-[#239a6e] to-[#53d69f] text-[#0b1f16] text-lg"
        onClick={() => onBoardResult(true)}
      >
        ✓ Richtig
      </button>
      <button
        type="button"
        className="w-full min-h-[56px] bg-gradient-to-r from-[#ff7676] to-[#ff9f64] text-[#2a0d0d] text-lg"
        onClick={() => onBoardResult(false)}
      >
        ✗ Falsch
      </button>
    </div>
  );
}
