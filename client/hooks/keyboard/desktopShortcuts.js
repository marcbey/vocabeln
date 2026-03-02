const DESKTOP_BREAKPOINT_QUERY = '(min-width: 768px)';
const EDITABLE_TARGET_SELECTOR =
  'input, textarea, select, [contenteditable], [role="textbox"]';
const MAC_PLATFORM_PATTERN = /mac|iphone|ipad|ipod/i;

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

export function shouldHandleDesktopShortcutKeyDown(event, options = {}) {
  const { allowInEditable = false } = options;

  if (!isDesktopViewport()) {
    return false;
  }

  if (event.defaultPrevented || event.isComposing) {
    return false;
  }

  if (event.metaKey) {
    return false;
  }

  if (!allowInEditable && isEditableShortcutTarget(event.target)) {
    return false;
  }

  return true;
}

export function isLetterShortcutPressed(event, letter) {
  const normalizedLetter = letter.toLowerCase();
  const expectedCode = `Key${normalizedLetter.toUpperCase()}`;

  if (event.code === expectedCode) {
    return true;
  }

  if (typeof event.key !== 'string') {
    return false;
  }

  return event.key.toLowerCase() === normalizedLetter;
}

export function isMacPlatform() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgentDataPlatform =
    typeof navigator.userAgentData?.platform === 'string'
      ? navigator.userAgentData.platform
      : '';
  const platform = userAgentDataPlatform || navigator.platform || '';
  if (MAC_PLATFORM_PATTERN.test(platform)) {
    return true;
  }

  const userAgent = navigator.userAgent || '';
  return MAC_PLATFORM_PATTERN.test(userAgent);
}

export function isShortcutModifierPressed(event) {
  if (event.shiftKey) {
    return false;
  }

  if (isMacPlatform()) {
    return event.ctrlKey && !event.altKey;
  }

  return event.altKey && !event.ctrlKey;
}

export function isShortcutModifierRelease(event) {
  if (isMacPlatform()) {
    return (
      event.key === 'Control' ||
      event.code === 'ControlLeft' ||
      event.code === 'ControlRight'
    );
  }

  return event.key === 'Alt' || event.code === 'AltLeft' || event.code === 'AltRight';
}

export function getShortcutHintLabel(letter) {
  const uppercaseLetter = letter.toUpperCase();
  return isMacPlatform() ? `⌃${uppercaseLetter}` : `Alt+${uppercaseLetter}`;
}
