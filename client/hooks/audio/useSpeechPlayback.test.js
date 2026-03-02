import { describe, expect, it } from 'vitest';
import { normalizePlaybackErrorMessage } from './useSpeechPlayback.js';

describe('useSpeechPlayback error normalization', () => {
  it('suppresses iOS user-agent permission playback errors', () => {
    const message =
      'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.';

    expect(normalizePlaybackErrorMessage(new Error(message))).toBe('');
  });

  it('suppresses matching not-allowed DOMException style errors', () => {
    const error = {
      name: 'NotAllowedError',
      message:
        'The request is not allowed by the user agent or the platform in the current context.',
    };

    expect(normalizePlaybackErrorMessage(error)).toBe('');
  });

  it('keeps normal user-facing error text', () => {
    expect(
      normalizePlaybackErrorMessage(
        new Error('Sprachausgabe ist gerade nicht verfügbar.')
      )
    ).toBe('Sprachausgabe ist gerade nicht verfügbar.');
  });

  it('uses default fallback when no message is present', () => {
    expect(normalizePlaybackErrorMessage({})).toBe(
      'Sprachausgabe fehlgeschlagen.'
    );
  });
});
