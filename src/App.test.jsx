import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./data/index.js', () => ({
  DEFAULT_CLASS_ID: 'class5',
  CLASS_OPTIONS: [
    {
      id: 'class5',
      label: 'Klasse 5',
      headline: 'Vokabeln für die Klasse 5',
    },
    {
      id: 'class6',
      label: 'Klasse 6',
      headline: 'Vokabeln für die Klasse 6',
    },
    {
      id: 'class7',
      label: 'Klasse 7',
      headline: 'Vokabeln für die Klasse 7',
    },
  ],
  CLASS_DATASETS: {
    class5: {
      vocabData: {
        'Class 5 - Page 1': [{ en: 'cat', de: 'Katze' }],
      },
      irregularData: [
        {
          german: 'sein',
          infinitive: 'be',
          simplePast: 'was',
          pastParticiple: 'been',
        },
      ],
    },
    class6: {
      vocabData: {
        'Class 6 - Page 1': [{ en: 'dog', de: 'Hund' }],
      },
      irregularData: [
        {
          german: 'gehen',
          infinitive: 'go',
          simplePast: 'went',
          pastParticiple: 'gone',
        },
      ],
    },
    class7: {
      vocabData: {
        'Class 7 - Page 1': [{ en: 'house', de: 'Haus' }],
      },
      irregularData: [
        {
          german: 'laufen',
          infinitive: 'run',
          simplePast: 'ran',
          pastParticiple: 'run',
        },
      ],
    },
  },
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

  it('stores progress per class and restores it on class switch', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Vokabeln für die Klasse 5')).toBeInTheDocument();

    const answerInput = screen.getByPlaceholderText('Deine Antwort...');
    const openClassMenu = async () => {
      await user.click(screen.getByRole('button', { name: /menü öffnen/i }));
      return screen.findByLabelText('Klasse');
    };

    await user.type(answerInput, 'Katze');
    await user.click(screen.getAllByRole('button', { name: 'Check!' })[0]);

    expect(localStorage.getItem('progress:class5')).toBeTruthy();

    const classSelectForClass6 = await openClassMenu();
    await user.selectOptions(classSelectForClass6, 'class6');
    expect(await screen.findByText('Vokabeln für die Klasse 6')).toBeInTheDocument();
    expect(await screen.findByText('dog')).toBeInTheDocument();

    const class6Input = screen.getByPlaceholderText('Deine Antwort...');
    await user.type(class6Input, 'Hund');
    await user.click(screen.getAllByRole('button', { name: 'Check!' })[0]);
    expect(localStorage.getItem('progress:class6')).toBeTruthy();

    const classSelectForClass7 = await openClassMenu();
    await user.selectOptions(classSelectForClass7, 'class7');
    expect(await screen.findByText('Vokabeln für die Klasse 7')).toBeInTheDocument();
    expect(await screen.findByText('house')).toBeInTheDocument();

    const class7Input = screen.getByPlaceholderText('Deine Antwort...');
    await user.type(class7Input, 'Haus');
    await user.click(screen.getAllByRole('button', { name: 'Check!' })[0]);
    expect(localStorage.getItem('progress:class7')).toBeTruthy();

    const classSelectForClass5 = await openClassMenu();
    await user.selectOptions(classSelectForClass5, 'class5');
    expect(await screen.findByText('Vokabeln für die Klasse 5')).toBeInTheDocument();

    const progressBadges = await screen.findAllByText(
      /1 richtig · 1 Versuche · 2 Fragen/i
    );
    expect(progressBadges.length).toBeGreaterThan(0);
  });

  it('auto-scrolls main to top on each mobile interaction in main, but not for header actions', async () => {
    const user = userEvent.setup();
    const originalMatchMedia = window.matchMedia;
    const originalRaf = window.requestAnimationFrame;
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoViewSpy = vi.fn();

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.requestAnimationFrame = vi.fn((callback) => {
      callback();
      return 1;
    });
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    try {
      render(<App />);

      await user.click(screen.getByRole('button', { name: /menü öffnen/i }));
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();

      await user.click(screen.getAllByRole('button', { name: 'Check!' })[0]);
      expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);

      await user.click(screen.getAllByRole('button', { name: 'Lösung zeigen' })[0]);
      expect(scrollIntoViewSpy).toHaveBeenCalledTimes(2);
    } finally {
      window.matchMedia = originalMatchMedia;
      window.requestAnimationFrame = originalRaf;
      if (originalScrollIntoView) {
        Element.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete Element.prototype.scrollIntoView;
      }
    }
  });
});
