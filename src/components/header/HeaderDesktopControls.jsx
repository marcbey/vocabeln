import classNames from 'classnames';
import ClassSelect from './ClassSelect.jsx';
import DirectionSelect from './DirectionSelect.jsx';
import HeaderActions from './HeaderActions.jsx';
import PageSelect from './PageSelect.jsx';

export default function HeaderDesktopControls({
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
}) {
  return (
    <div className="hidden md:flex flex-1 items-center gap-3 min-w-0 overflow-x-auto">
      <ClassSelect
        value={activeClassId}
        options={classOptions}
        onChange={onClassChange}
        className="w-[130px] shrink-0"
      />

      <div
        className={classNames('flex items-center shrink-0', {
          'opacity-50 pointer-events-none': isIrregular,
        })}
      >
        <PageSelect
          pages={pages}
          page={page}
          completedPages={completedPages}
          disabled={isIrregular}
          onChange={onPageChange}
          className="w-[145px]"
        />
      </div>

      <DirectionSelect
        direction={direction}
        onChange={onDirectionChange}
        className="w-[210px] shrink-0"
      />

      <div className="ml-auto shrink-0">
        <HeaderActions
          boardMode={boardMode}
          onToggleBoardMode={onToggleBoardMode}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
