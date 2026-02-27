import classNames from 'classnames';
import DirectionSelect from './DirectionSelect.jsx';
import HeaderActions from './HeaderActions.jsx';
import PageSelect from './PageSelect.jsx';

export default function HeaderMobilePanel({
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
    <div className="md:hidden flex flex-col gap-3 bg-panel/90 border border-white/10 rounded-xl p-3 shadow-deep">
      <div className="flex gap-3 items-center justify-between">
        <div
          className={classNames('flex items-center flex-1 min-w-[150px] max-w-[200px]', {
            'opacity-50 pointer-events-none': isIrregular,
          })}
        >
          <PageSelect
            pages={pages}
            page={page}
            completedPages={completedPages}
            disabled={isIrregular}
            onChange={onPageChange}
            className="pr-7 w-full"
          />
        </div>

        <div className="flex items-center flex-1">
          <DirectionSelect
            direction={direction}
            onChange={onDirectionChange}
            className="pr-7 w-full"
          />
        </div>
      </div>

      <HeaderActions
        boardMode={boardMode}
        onToggleBoardMode={onToggleBoardMode}
        onReset={onReset}
        fullWidth
      />
    </div>
  );
}
