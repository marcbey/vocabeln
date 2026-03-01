import { useEffect } from 'react';
import classNames from 'classnames';
import ClassSelect from './ClassSelect.jsx';
import DirectionSelect from './DirectionSelect.jsx';
import FilterModeSelect from './FilterModeSelect.jsx';
import HeaderActions from './HeaderActions.jsx';
import MobilePanelSection from './MobilePanelSection.jsx';
import PageSelect from './PageSelect.jsx';
import UnitSelect from './UnitSelect.jsx';

export default function HeaderMobilePanel({
  activeClassId,
  classOptions,
  filterMode,
  pages,
  page,
  units,
  unit,
  completedPages,
  completedUnits,
  isIrregular,
  direction,
  boardMode,
  onClassChange,
  onFilterModeChange,
  onPageChange,
  onUnitChange,
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

        <MobilePanelSection
          label="Filter"
          className={classNames('md:hidden', {
            'opacity-60': isIrregular,
          })}
        >
          <FilterModeSelect
            value={filterMode}
            onChange={onFilterModeChange}
            disabled={isIrregular}
            className="w-full"
          />
        </MobilePanelSection>

        <MobilePanelSection
          label="Seite"
          className={classNames('md:hidden', {
            'opacity-60': isIrregular || filterMode === 'unit',
          })}
        >
          <PageSelect
            pages={pages}
            page={page}
            completedPages={completedPages}
            disabled={isIrregular || filterMode === 'unit'}
            onChange={onPageChange}
            className="w-full"
          />
        </MobilePanelSection>

        <MobilePanelSection
          label="Unit"
          className={classNames('md:hidden', {
            'opacity-60': isIrregular || filterMode === 'page',
          })}
        >
          <UnitSelect
            units={units}
            unit={unit}
            completedUnits={completedUnits}
            disabled={isIrregular || filterMode === 'page'}
            onChange={onUnitChange}
            className="w-full"
          />
        </MobilePanelSection>

        <MobilePanelSection label="Richtung" className="md:hidden">
          <DirectionSelect
            direction={direction}
            onChange={onDirectionChange}
            className="w-full"
          />
        </MobilePanelSection>

        <MobilePanelSection
          label="Optionen"
          className="border-t border-[#3f567e]/35 pt-3 md:hidden"
        >
          <HeaderActions
            boardMode={boardMode}
            onToggleBoardMode={onToggleBoardMode}
            onReset={onReset}
            fullWidth
          />
        </MobilePanelSection>

        <MobilePanelSection
          label="Klasse wechseln"
          className="border-t border-[#3f567e]/35 pt-3"
        >
          <ClassSelect
            value={activeClassId}
            options={classOptions}
            onChange={onClassChange}
            className="w-full"
          />
        </MobilePanelSection>
      </div>
    </div>
  );
}
