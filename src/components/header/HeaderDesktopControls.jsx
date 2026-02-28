import classNames from 'classnames';
import DirectionSelect from './DirectionSelect.jsx';
import HeaderActions from './HeaderActions.jsx';
import PageSelect from './PageSelect.jsx';

export default function HeaderDesktopControls({
  pages,
  page,
  completedPages,
  isIrregular,
  direction,
  boardMode,
  onPageChange,
  onDirectionChange,
  onToggleBoardMode,
  onReset,
}) {
  return (
    <div className="hidden md:grid w-full min-w-0 gap-2 lg:gap-3 grid-cols-2 xl:grid-cols-[220px_minmax(260px,1fr)_auto]">

      <div
        className={classNames('flex items-center min-w-0', {
          'opacity-50 pointer-events-none': isIrregular,
        })}
      >
        <PageSelect
          pages={pages}
          page={page}
          completedPages={completedPages}
          disabled={isIrregular}
          onChange={onPageChange}
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
