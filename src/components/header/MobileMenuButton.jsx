export default function MobileMenuButton({ open, onToggle }) {
  return (
    <button
      type="button"
      className="md:hidden secondary px-2 py-2 rounded-lg border flex flex-col items-end gap-1 min-w-[38px]"
      onClick={onToggle}
      aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
      aria-expanded={open}
    >
      <span className="block w-5 h-0.5 bg-text rounded-sm" />
      <span className="block w-5 h-0.5 bg-text rounded-sm" />
      <span className="block w-4 h-0.5 bg-text rounded-sm" />
    </button>
  );
}
