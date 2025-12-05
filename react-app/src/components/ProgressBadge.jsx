import React from 'react';
import classNames from 'classnames';

export default function ProgressBadge({ counts, className }) {
  return (
    <div className={classNames('badge inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-400/20 to-pink-300/20 border border-white/10 font-bold text-text', className)}>
      <small className="text-muted font-semibold">Fortschritt</small>
      {counts.correctCount} richtig · {counts.asked} Versuche · {counts.totalCount} Fragen
    </div>
  );
}
