import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { isMacPlatform } from '../../hooks/keyboard/desktopShortcuts.js';
import QuestionPrompt from './QuestionPrompt.jsx';

const speechPlaybackMock = vi.hoisted(() => ({
  isLoading: false,
  isPlaying: false,
  activePlaybackType: null,
  error: '',
  playVocabulary: vi.fn(),
  playExampleSentence: vi.fn(),
}));

vi.mock('../../hooks/audio/useSpeechPlayback.js', () => ({
  useSpeechPlayback: () => speechPlaybackMock,
}));

vi.mock('../../hooks/question/useSolutionRevealFlash.js', () => ({
  useSolutionRevealFlash: () => '',
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

function renderQuestionPrompt(overrides = {}) {
  const defaultProps = {
    questionText: 'cat',
    questionLanguage: 'en',
    canSpeak: true,
    translation: 'Katze',
    showingSolution: false,
    showTranslation: false,
    onSpeechPlaybackErrorChange: vi.fn(),
  };

  return render(<QuestionPrompt {...defaultProps} {...overrides} />);
}

function shortcutModifierProps() {
  return isMacPlatform() ? { ctrlKey: true } : { altKey: true };
}

describe('QuestionPrompt desktop shortcuts', () => {
  beforeEach(() => {
    speechPlaybackMock.playVocabulary.mockReset();
    speechPlaybackMock.playExampleSentence.mockReset();
    window.matchMedia = createMatchMediaMock();
  });

  afterEach(() => {
    window.matchMedia = nativeMatchMedia;
  });

  it('handles v and b keyboard shortcuts on desktop', () => {
    renderQuestionPrompt();

    fireEvent.keyDown(window, { key: 'v', ...shortcutModifierProps() });
    expect(speechPlaybackMock.playVocabulary).toHaveBeenCalledWith({
      text: 'cat',
      language: 'en',
    });

    fireEvent.keyDown(window, { key: 'b', ...shortcutModifierProps() });
    expect(speechPlaybackMock.playExampleSentence).toHaveBeenCalledWith({
      text: 'cat',
      language: 'en',
    });
  });

  it('ignores playback shortcuts when speaking is disabled', () => {
    renderQuestionPrompt({ canSpeak: false });

    fireEvent.keyDown(window, { key: 'v', ...shortcutModifierProps() });
    fireEvent.keyDown(window, { key: 'b', ...shortcutModifierProps() });

    expect(speechPlaybackMock.playVocabulary).toHaveBeenCalledTimes(0);
    expect(speechPlaybackMock.playExampleSentence).toHaveBeenCalledTimes(0);
  });

  it('ignores plain key presses without platform shortcut modifier', () => {
    renderQuestionPrompt();

    fireEvent.keyDown(window, { key: 'v' });
    fireEvent.keyDown(window, { key: 'b' });
    if (isMacPlatform()) {
      fireEvent.keyDown(window, { key: 'v', altKey: true });
      fireEvent.keyDown(window, { key: 'b', altKey: true });
    } else {
      fireEvent.keyDown(window, { key: 'v', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    }

    expect(speechPlaybackMock.playVocabulary).toHaveBeenCalledTimes(0);
    expect(speechPlaybackMock.playExampleSentence).toHaveBeenCalledTimes(0);
  });

  it('can trigger playback shortcuts when an input is focused with platform modifier', () => {
    renderQuestionPrompt();
    const focusedInput = document.createElement('input');
    document.body.appendChild(focusedInput);
    focusedInput.focus();

    fireEvent.keyDown(focusedInput, { key: 'v', ...shortcutModifierProps() });
    fireEvent.keyDown(focusedInput, { key: 'b', ...shortcutModifierProps() });

    expect(speechPlaybackMock.playVocabulary).toHaveBeenCalledTimes(1);
    expect(speechPlaybackMock.playExampleSentence).toHaveBeenCalledTimes(1);

    document.body.removeChild(focusedInput);
  });

  it('handles layout-modified key output via event.code', () => {
    renderQuestionPrompt();

    fireEvent.keyDown(window, {
      key: '√',
      code: 'KeyV',
      ...shortcutModifierProps(),
    });

    expect(speechPlaybackMock.playVocabulary).toHaveBeenCalledTimes(1);
  });
});
