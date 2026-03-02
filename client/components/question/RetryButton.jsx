export default function RetryButton({ onRetry }) {
  return (
    <button
      type="button"
      className="retry-btn mt-3 w-full min-h-[56px] bg-gradient-to-r from-[#f3a229] to-[#d86e00] text-[#1f1300] font-extrabold py-3 rounded-xl"
      onClick={onRetry}
    >
      Diese Seite nochmal üben
    </button>
  );
}
