import React from 'react';
import classNames from 'classnames';

export default function ProgressBadge({ counts, className }) {
  return (
    <div
      className={classNames(
        'badge inline-flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-3 py-2.5 font-bold text-text',
        className
      )}
    >
      <small className="text-muted text-[12px] uppercase tracking-[0.08em] font-extrabold">
        Fortschritt
      </small>
      <span className="font-extrabold text-[0.96rem]">
        {counts.correctCount} richtig · {counts.asked} Versuche · {counts.totalCount} Fragen
      </span>
    </div>
  );
}
