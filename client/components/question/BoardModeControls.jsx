export default function BoardModeControls({ onBoardResult }) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        type="button"
        className="board-result board-correct w-full min-h-[56px] text-[#102218] text-lg"
        onClick={() => onBoardResult(true)}
      >
        ✓ Richtig
      </button>
      <button
        type="button"
        className="board-result board-wrong w-full min-h-[56px] text-[#2a0d0d] text-lg"
        onClick={() => onBoardResult(false)}
      >
        ✗ Falsch
      </button>
    </div>
  );
}
