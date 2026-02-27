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
}) {
  return (
    <div className="md:hidden flex gap-3 items-center overflow-x-auto bg-panel/90 border border-white/10 rounded-xl p-3 shadow-deep">
      <ClassSelect
        value={activeClassId}
        options={classOptions}
        onChange={onClassChange}
        className="pr-7 min-w-[130px] w-[130px] shrink-0"
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
          className="pr-7 min-w-[145px] w-[145px]"
        />
      </div>

      <div className="flex items-center shrink-0">
        <DirectionSelect
          direction={direction}
          onChange={onDirectionChange}
          className="pr-7 min-w-[210px] w-[210px]"
        />
      </div>

      <div className="shrink-0">
        <HeaderActions
          boardMode={boardMode}
          onToggleBoardMode={onToggleBoardMode}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
