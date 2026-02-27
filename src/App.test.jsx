import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./data/vocab_data.json', () => ({
  default: {
    'Seite 1': [{ en: 'cat', de: 'Katze' }],
  },
}));

vi.mock('./data/irregular_vocab_data.json', () => ({
  default: [
    {
      german: 'sein',
      infinitive: 'be',
      simplePast: 'was',
      pastParticiple: 'been',
    },
  ],
}));

import App from './App.jsx';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  it('accepts a correct regular answer and updates progress', async () => {
    const user = userEvent.setup();
    render(<App />);

    const answerInput = screen.getByPlaceholderText('Deine Antwort...');
    await user.type(answerInput, 'Katze');
    await user.click(screen.getAllByRole('button', { name: 'Check!' })[0]);

    const progressBadges = await screen.findAllByText(
      /1 richtig · 1 Versuche · 2 Fragen/i
    );
    expect(progressBadges.length).toBeGreaterThan(0);
  });

  it('shows solution and counts it as an attempt', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Lösung zeigen' })[0]);

    expect(screen.getAllByRole('button', { name: 'Weiter' })[0]).toBeInTheDocument();
    const progressBadges = await screen.findAllByText(
      /0 richtig · 1 Versuche · 2 Fragen/i
    );
    expect(progressBadges.length).toBeGreaterThan(0);
  });

  it('switches to irregular mode and validates irregular answers', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getAllByLabelText('Richtung')[0], 'irregular');

    expect(screen.getByText('sein')).toBeInTheDocument();

    const answerInput = screen.getByPlaceholderText(
      'Infinitive, Simple Past, Past Participle'
    );
    await user.type(answerInput, 'be, was, been');
    await user.click(screen.getAllByRole('button', { name: 'Check!' })[0]);

    const progressBadges = await screen.findAllByText(
      /1 richtig · 1 Versuche · 1 Fragen/i
    );
    expect(progressBadges.length).toBeGreaterThan(0);
  });
});
