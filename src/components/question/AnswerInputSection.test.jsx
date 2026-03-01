import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

    fireEvent.keyDown(window, { key: 'c' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'l' });
    expect(onShowSolution).toHaveBeenCalledTimes(1);
  });

  it('only triggers "Weiter" shortcut when solution is already shown', () => {
    const onShowSolution = vi.fn();
    const { rerender, props } = renderAnswerInputSection({
      showingSolution: false,
      onShowSolution,
    });

    fireEvent.keyDown(window, { key: 'w' });
    expect(onShowSolution).toHaveBeenCalledTimes(0);

    rerender(
      <AnswerInputSection
        {...props}
        showingSolution
        onShowSolution={onShowSolution}
      />
    );

    fireEvent.keyDown(window, { key: 'w' });
    expect(onShowSolution).toHaveBeenCalledTimes(1);
  });

  it('supports push-to-talk via m keydown/keyup', () => {
    renderAnswerInputSection();

    fireEvent.keyDown(window, { key: 'm' });
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'm', repeat: true });
    expect(speechInputMock.startRecording).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(window, { key: 'm' });
    expect(speechInputMock.stopRecording).toHaveBeenCalledTimes(1);
  });

  it('does not trigger shortcuts while typing in the answer input', () => {
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
});

afterEach(() => {
  window.matchMedia = nativeMatchMedia;
});
