import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useQuizStatusFlash } from './useQuizStatusFlash.js';

const confirmMock = vi.fn();
const errorMock = vi.fn();

vi.mock('ios-haptics', () => ({
  haptic: {
    confirm: () => confirmMock(),
    error: () => errorMock(),
  },
}));

describe('useQuizStatusFlash haptics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    confirmMock.mockReset();
    errorMock.mockReset();
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

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(errorMock).not.toHaveBeenCalled();
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

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('does not trigger haptics for unknown statuses', () => {
    const { result } = renderHook(() =>
      useQuizStatusFlash({
        boardMode: false,
        showingSolution: false,
        onRefocus: vi.fn(),
      })
    );

    act(() => {
      result.current.setStatusFlash('something-else');
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });
});
