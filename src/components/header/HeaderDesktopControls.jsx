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
    <div className="hidden md:flex flex-1 items-center gap-3">
      <div className="flex gap-3 items-center justify-end md:ml-auto">
        <div
          className={classNames('flex items-center', {
            'opacity-50 pointer-events-none': isIrregular,
          })}
        >
          <PageSelect
            pages={pages}
            page={page}
            completedPages={completedPages}
            disabled={isIrregular}
            onChange={onPageChange}
            className="w-[120px] sm:w-[140px]"
          />
        </div>
        <DirectionSelect
          direction={direction}
          onChange={onDirectionChange}
          className="w-[190px] sm:w-[210px]"
        />
      </div>

      <div className="hidden md:flex items-center px-3">
        <span className="w-px h-10 bg-white/20" aria-hidden />
      </div>

      <div className="flex items-center gap-3 justify-end">
        <HeaderActions
          boardMode={boardMode}
          onToggleBoardMode={onToggleBoardMode}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
