import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { isMacPlatform } from '../../hooks/keyboard/desktopShortcuts.js';
import AnswerInputSection from './AnswerInputSection.jsx';

const speechInputMock = vi.hoisted(() => ({
  isRecording: false,
  isSubmitting: false,
  error: '',
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
}));

vi.mock('../../hooks/audio/useSpeechInput.js', () => ({
  useSpeechInput: () => speechInputMock,
}));

const nativeMatchMedia = window.matchMedia;

function createMatchMediaMock() {
  return vi.fn().mockImplementation((query) => ({
    matches: query === '(min-width: 768px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderAnswerInputSection(overrides = {}) {
  const defaultProps = {
    inputRef: { current: null },
    value: '',
    status: '',
    isIrregular: false,
    answerLanguage: 'de',
    disableSubmit: false,
    disableShowSolution: false,
    showingSolution: false,
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onSubmitSpokenAnswer: vi.fn(),
    onShowSolution: vi.fn(),
    onSpeechInputErrorChange: vi.fn(),
  };

  const props = { ...defaultProps, ...overrides };
  const rendered = render(<AnswerInputSection {...props} />);
  return { ...rendered, props };
}

function shortcutModifierProps() {
  return isMacPlatform() ? { ctrlKey: true } : { altKey: true };
}

describe('AnswerInputSection desktop shortcuts', () => {
  beforeEach(() => {
    speechInputMock.startRecording.mockReset();
    speechInputMock.stopRecording.mockReset();
    window.matchMedia = createMatchMediaMock();
  });

  it('handles check and solution shortcuts on desktop', () => {
    const onSubmit = vi.fn();
    const onShowSolution = vi.fn();

    renderAnswerInputSection({
      onSubmit,
      onShowSolution,
    });

    fireEvent.keyDown(window, { key: 'c', ...shortcutModifierProps() });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'l', ...shortcutModifierProps() });
    expect(onShowSolution).toHaveBeenCalledTimes(1);
  });

  it('only triggers "Weiter" shortcut when solution is already shown', () => {
    const onShowSolution = vi.fn();
    const { rerender, props } = renderAnswerInputSection({
      showingSolution: false,
      onShowSolution,
    });

    fireEvent.keyDown(window, { key: 'w', ...shortcutModifierProps() });
    expect(onShowSolution).toHaveBeenCalledTimes(0);

    rerender(
      <AnswerInputSection
        {...props}
        showingSolution
        onShowSolution={onShowSolution}
      />
    );

    fireEvent.keyDown(window, { key: 'w', ...shortcutModifierProps() });
    expect(onShowSolution).toHaveBeenCalledTimes(1);
  });

  it('supports push-to-talk via m keydown/keyup', () => {
    renderAnswerInputSection();

    fireEvent.keyDown(window, { key: 'm', ...shortcutModifierProps() });
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, {
      key: 'm',
      repeat: true,
      ...shortcutModifierProps(),
    });
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(window, { key: 'm' });
    expect(speechInputMock.stopRecording).toHaveBeenCalledTimes(1);
  });

  it('does not trigger shortcuts while typing in the answer input without modifier', () => {
    const onSubmit = vi.fn();
    const onShowSolution = vi.fn();

    renderAnswerInputSection({
      onSubmit,
      onShowSolution,
    });

    const answerInput = screen.getByPlaceholderText('Deine Antwort...');
    answerInput.focus();

    fireEvent.keyDown(answerInput, { key: 'c' });
    fireEvent.keyDown(answerInput, { key: 'l' });
    fireEvent.keyDown(answerInput, { key: 'm' });

    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(onShowSolution).toHaveBeenCalledTimes(0);
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(0);
  });

  it('ignores plain key presses without platform shortcut modifier', () => {
    const onSubmit = vi.fn();
    const onShowSolution = vi.fn();

    renderAnswerInputSection({
      onSubmit,
      onShowSolution,
    });

    fireEvent.keyDown(window, { key: 'c' });
    fireEvent.keyDown(window, { key: 'l' });
    fireEvent.keyDown(window, { key: 'm' });
    if (isMacPlatform()) {
      fireEvent.keyDown(window, { key: 'c', altKey: true });
      fireEvent.keyDown(window, { key: 'l', altKey: true });
      fireEvent.keyDown(window, { key: 'm', altKey: true });
    } else {
      fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'l', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'm', ctrlKey: true });
    }

    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(onShowSolution).toHaveBeenCalledTimes(0);
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(0);
  });

  it('can trigger shortcuts while answer input is focused with platform modifier', () => {
    const onSubmit = vi.fn();
    const onShowSolution = vi.fn();

    renderAnswerInputSection({
      onSubmit,
      onShowSolution,
    });

    const answerInput = screen.getByPlaceholderText('Deine Antwort...');
    answerInput.focus();

    fireEvent.keyDown(answerInput, { key: 'c', ...shortcutModifierProps() });
    fireEvent.keyDown(answerInput, { key: 'l', ...shortcutModifierProps() });
    fireEvent.keyDown(answerInput, { key: 'm', ...shortcutModifierProps() });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onShowSolution).toHaveBeenCalledTimes(1);
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(1);
  });

  it('handles layout-modified key output via event.code', () => {
    const onShowSolution = vi.fn();

    renderAnswerInputSection({
      onShowSolution,
      showingSolution: false,
    });

    fireEvent.keyDown(window, {
      key: '¬',
      code: 'KeyL',
      ...shortcutModifierProps(),
    });

    expect(onShowSolution).toHaveBeenCalledTimes(1);
  });
});

afterEach(() => {
  window.matchMedia = nativeMatchMedia;
});
