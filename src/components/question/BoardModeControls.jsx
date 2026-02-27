export default function BoardModeControls({ onBoardResult }) {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      <button
        type="button"
        className="flex-1 min-w-[140px] bg-gradient-to-r from-good to-[#8ef7be] text-[#063621]"
        onClick={() => onBoardResult(true)}
      >
        ✓ Richtig
      </button>
      <button
        type="button"
        className="flex-1 min-w-[140px] bg-gradient-to-r from-[#ff8585] to-[#ffb4b4] text-[#3a0d0d]"
        onClick={() => onBoardResult(false)}
      >
        ✗ Falsch
      </button>
    </div>
  );
}
