import classNames from 'classnames';
import FilterModeSelect from './FilterModeSelect.jsx';
import DirectionSelect from './DirectionSelect.jsx';
import HeaderActions from './HeaderActions.jsx';
import PageSelect from './PageSelect.jsx';
import UnitSelect from './UnitSelect.jsx';

export default function HeaderDesktopControls({
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
  onFilterModeChange,
  onPageChange,
  onUnitChange,
  onDirectionChange,
  onToggleBoardMode,
  onReset,
}) {
  return (
    <div className="hidden md:flex w-full min-w-0 flex-wrap items-center gap-2 lg:gap-3">
      <FilterModeSelect
        value={filterMode}
        onChange={onFilterModeChange}
        disabled={isIrregular}
        className="w-[102px] shrink-0"
      />

      <div
        className={classNames('flex items-center shrink-0', {
          'opacity-50': isIrregular || filterMode === 'unit',
        })}
      >
        <PageSelect
          pages={pages}
          page={page}
          completedPages={completedPages}
          disabled={isIrregular || filterMode === 'unit'}
          onChange={onPageChange}
          className="h-full w-auto"
        />
      </div>

      <div
        className={classNames('flex items-center shrink-0', {
          'opacity-50': isIrregular || filterMode === 'page',
        })}
      >
        <UnitSelect
          units={units}
          unit={unit}
          completedUnits={completedUnits}
          disabled={isIrregular || filterMode === 'page'}
          onChange={onUnitChange}
          className="h-full w-[132px]"
        />
      </div>

      <DirectionSelect
        direction={direction}
        onChange={onDirectionChange}
        className="w-[208px] shrink-0"
      />

      <div className="md:ml-auto">
        <HeaderActions
          boardMode={boardMode}
          onToggleBoardMode={onToggleBoardMode}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
