import { useEffect } from 'react';
import classNames from 'classnames';
import ClassSelect from './ClassSelect.jsx';
import DirectionSelect from './DirectionSelect.jsx';
import HeaderActions from './HeaderActions.jsx';
import PageSelect from './PageSelect.jsx';

export default function HeaderMobilePanel({
  activeClassId,
  classOptions,
  pages,
  page,
  completedPages,
  isIrregular,
  direction,
  boardMode,
  onClassChange,
  onPageChange,
  onDirectionChange,
  onToggleBoardMode,
  onReset,
  onClose,
}) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-end p-4 md:p-6">
      <div
        className="absolute inset-0 bg-[#101d36]/40 backdrop-blur-[1px] cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[340px] grid gap-3 rounded-xl2 border-2 border-[#3f567e] bg-white p-4 shadow-deep">
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="secondary min-h-[40px] px-3 py-1.5 text-[13px]"
            onClick={onClose}
          >
            Schliessen
          </button>
        </div>

        <div
          className={classNames('grid gap-2 md:hidden', {
            'opacity-60': isIrregular,
          })}
        >
          <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
            Seite
          </p>
          <PageSelect
            pages={pages}
            page={page}
            completedPages={completedPages}
            disabled={isIrregular}
            onChange={onPageChange}
            className="w-full"
          />
        </div>

        <div className="grid gap-2 md:hidden">
          <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
            Richtung
          </p>
          <DirectionSelect
            direction={direction}
            onChange={onDirectionChange}
            className="w-full"
          />
        </div>

        <div className="grid gap-2 border-t border-[#3f567e]/35 pt-3 md:hidden">
          <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
            Optionen
          </p>
          <HeaderActions
            boardMode={boardMode}
            onToggleBoardMode={onToggleBoardMode}
            onReset={onReset}
            fullWidth
          />
        </div>

        <div className="grid gap-2 border-t border-[#3f567e]/35 pt-3">
          <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
            Klasse wechseln
          </p>
          <ClassSelect
            value={activeClassId}
            options={classOptions}
            onChange={onClassChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
