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
    <div className="md:hidden mt-4 grid gap-3 border-t-2 border-[#3f567e] pt-3">
      <ProgressBadge counts={counts} className="w-full" />

      {!pageComplete && !boardMode && (
        <QuestionActions
          showingSolution={showingSolution}
          disableSubmit={disableSubmit}
          disableShowSolution={disableShowSolution}
          onSubmit={onSubmit}
          onShowSolution={onShowSolution}
          className="grid grid-cols-2 gap-2 w-full"
        />
      )}
    </div>
  );
}
