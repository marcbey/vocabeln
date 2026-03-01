import classNames from 'classnames';
import { getShortcutHintLabel } from '../../hooks/keyboard/desktopShortcuts.js';

export default function KeyboardShortcutHint({ shortcutKey, hold = false, className }) {
  const keyLabel = getShortcutHintLabel(shortcutKey);

  return (
    <span
      aria-hidden="true"
      className={classNames(
        'hidden md:inline-flex items-center gap-1 rounded-md border border-current/35 bg-white/75 px-1.5 py-[2px] text-[0.7rem] font-black leading-none text-[#102748] opacity-90',
        className
      )}
    >
      <kbd className="not-italic uppercase">{keyLabel}</kbd>
      {hold ? (
        <span className="text-[0.62rem] font-extrabold normal-case leading-none">halten</span>
      ) : null}
    </span>
  );
}
