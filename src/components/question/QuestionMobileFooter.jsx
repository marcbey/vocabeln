import ProgressBadge from '../ProgressBadge.jsx';
import QuestionActions from './QuestionActions.jsx';

export default function QuestionMobileFooter({
  counts,
  pageComplete,
  boardMode,
  showingSolution,
  disableSubmit,
  disableShowSolution,
  onSubmit,
  onShowSolution,
}) {
  return (
    <div className="md:hidden mt-3 flex flex-wrap sm:flex-nowrap items-center gap-3 justify-between">
      <ProgressBadge
        counts={counts}
        className="order-2 sm:order-1 w-full sm:w-auto"
      />

      {!pageComplete && !boardMode && (
        <QuestionActions
          showingSolution={showingSolution}
          disableSubmit={disableSubmit}
          disableShowSolution={disableShowSolution}
          onSubmit={onSubmit}
          onShowSolution={onShowSolution}
          className="flex gap-3 ml-auto order-1 sm:order-2 w-full sm:w-auto justify-end"
        />
      )}
    </div>
  );
}
