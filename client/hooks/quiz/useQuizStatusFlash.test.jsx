import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useQuizStatusFlash } from './useQuizStatusFlash.js';

const triggerMock = vi.fn();
const useWebHapticsMock = vi.fn();

vi.mock('web-haptics/react', () => ({
  useWebHaptics: () => useWebHapticsMock(),
}));

function mockMatchMedia(matches) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({ matches }),
  });
}

describe('useQuizStatusFlash haptics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    triggerMock.mockReset();
    useWebHapticsMock.mockReturnValue({
      trigger: triggerMock,
      isSupported: true,
    });
    mockMatchMedia(true);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('triggers success haptic for correct answers on mobile', () => {
    const { result } = renderHook(() =>
      useQuizStatusFlash({
        boardMode: false,
        showingSolution: false,
        onRefocus: vi.fn(),
      })
    );

    act(() => {
      result.current.setStatusFlash('correct');
    });

    expect(triggerMock).toHaveBeenCalledWith('success');
  });

  it('triggers error haptic for wrong answers on mobile', () => {
    const { result } = renderHook(() =>
      useQuizStatusFlash({
        boardMode: false,
        showingSolution: false,
        onRefocus: vi.fn(),
      })
    );

    act(() => {
      result.current.setStatusFlash('wrong');
    });

    expect(triggerMock).toHaveBeenCalledWith('error');
  });

  it('does not trigger haptics on non-mobile pointers', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() =>
      useQuizStatusFlash({
        boardMode: false,
        showingSolution: false,
        onRefocus: vi.fn(),
      })
    );

    act(() => {
      result.current.setStatusFlash('correct');
    });

    expect(triggerMock).not.toHaveBeenCalled();
  });

  it('does not trigger haptics when support is unavailable', () => {
    useWebHapticsMock.mockReturnValue({
      trigger: triggerMock,
      isSupported: false,
    });
    const { result } = renderHook(() =>
      useQuizStatusFlash({
        boardMode: false,
        showingSolution: false,
        onRefocus: vi.fn(),
      })
    );

    act(() => {
      result.current.setStatusFlash('wrong');
    });

    expect(triggerMock).not.toHaveBeenCalled();
  });
});
