const DESKTOP_BREAKPOINT_QUERY = '(min-width: 768px)';
const EDITABLE_TARGET_SELECTOR =
  'input, textarea, select, [contenteditable], [role="textbox"]';

export function isDesktopViewport() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches;
  }

  return window.innerWidth >= 768;
}

export function isEditableShortcutTarget(target) {
  if (typeof Element === 'undefined' || !(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(EDITABLE_TARGET_SELECTOR));
}

export function shouldHandleDesktopShortcutKeyDown(event) {
  if (!isDesktopViewport()) {
    return false;
  }

  if (event.defaultPrevented || event.isComposing) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  if (isEditableShortcutTarget(event.target)) {
    return false;
  }

  return true;
}
