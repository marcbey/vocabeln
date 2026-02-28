import { useCallback } from 'react';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';
const MAIN_INTERACTION_SELECTOR =
  'button, [role="button"], input, select, textarea, [data-main-action]';

function isMobileViewport() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  }

  return window.innerWidth <= 767;
}

function isEnabledMainAction(actionElement) {
  if (
    actionElement instanceof HTMLButtonElement ||
    actionElement instanceof HTMLInputElement ||
    actionElement instanceof HTMLSelectElement ||
    actionElement instanceof HTMLTextAreaElement
  ) {
    return !actionElement.disabled;
  }

  return actionElement.getAttribute('aria-disabled') !== 'true';
}

function shouldTriggerMainAutoScroll(target) {
  if (typeof Element === 'undefined' || !(target instanceof Element)) {
    return false;
  }

  const actionElement = target.closest(MAIN_INTERACTION_SELECTOR);
  if (!actionElement) {
    return false;
  }

  return isEnabledMainAction(actionElement);
}

export function useMainMobileAutoScroll(mainRef) {
  const scrollMainIntoViewOnMobileInteraction = useCallback(() => {
    if (!isMobileViewport()) {
      return;
    }

    window.requestAnimationFrame(() => {
      mainRef.current?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [mainRef]);

  const handleMainPointerDownCapture = useCallback(
    (event) => {
      if (!shouldTriggerMainAutoScroll(event.target)) {
        return;
      }

      scrollMainIntoViewOnMobileInteraction();
    },
    [scrollMainIntoViewOnMobileInteraction]
  );

  const handleMainKeyDownCapture = useCallback(
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      if (!shouldTriggerMainAutoScroll(event.target)) {
        return;
      }

      scrollMainIntoViewOnMobileInteraction();
    },
    [scrollMainIntoViewOnMobileInteraction]
  );

  return {
    handleMainPointerDownCapture,
    handleMainKeyDownCapture,
  };
}
