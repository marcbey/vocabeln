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
    <div className="hidden md:grid w-full min-w-0 gap-2 lg:gap-3 grid-cols-2 xl:grid-cols-[160px_220px_220px_minmax(220px,1fr)_auto]">
      <FilterModeSelect
        value={filterMode}
        onChange={onFilterModeChange}
        disabled={isIrregular}
        className="w-full min-w-0"
      />

      <div
        className={classNames('flex items-center min-w-0', {
          'opacity-50': isIrregular || filterMode === 'unit',
        })}
      >
        <PageSelect
          pages={pages}
          page={page}
          completedPages={completedPages}
          disabled={isIrregular || filterMode === 'unit'}
          onChange={onPageChange}
          className="w-full min-w-0"
        />
      </div>

      <div
        className={classNames('flex items-center min-w-0', {
          'opacity-50': isIrregular || filterMode === 'page',
        })}
      >
        <UnitSelect
          units={units}
          unit={unit}
          completedUnits={completedUnits}
          disabled={isIrregular || filterMode === 'page'}
          onChange={onUnitChange}
          className="w-full min-w-0"
        />
      </div>

      <DirectionSelect
        direction={direction}
        onChange={onDirectionChange}
        className="w-full min-w-0"
      />

      <div className="col-span-2 xl:col-span-1 xl:justify-self-end">
        <HeaderActions
          boardMode={boardMode}
          onToggleBoardMode={onToggleBoardMode}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
