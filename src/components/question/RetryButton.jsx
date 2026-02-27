export default function RetryButton({ onRetry }) {
  return (
    <button
      type="button"
      className="retry-btn mt-3 w-full bg-gradient-to-r from-accent2 to-accent text-[#031524] font-extrabold py-3 rounded-xl"
      onClick={onRetry}
    >
      Diese Seite nochmal üben
    </button>
  );
}
