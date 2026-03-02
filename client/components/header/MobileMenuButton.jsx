export default function MobileMenuButton({ open, onToggle }) {
  return (
    <button
      type="button"
      className="secondary ml-auto px-2.5 py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 min-w-[46px]"
      onClick={onToggle}
      aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
      aria-expanded={open}
    >
      <span className="block w-5 h-0.5 bg-text rounded-sm" />
      <span className="block w-5 h-0.5 bg-text rounded-sm" />
      <span className="block w-5 h-0.5 bg-text rounded-sm" />
    </button>
  );
}
