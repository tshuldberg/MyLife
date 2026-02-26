import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WordsScreen from '../index';

const getMyWordsLanguagesMock = vi.fn();
const lookupWordMock = vi.fn();

vi.mock('@mylife/words', () => ({
  getMyWordsLanguages: (...args: unknown[]) => getMyWordsLanguagesMock(...args),
  lookupWord: (...args: unknown[]) => lookupWordMock(...args),
}));

describe('WordsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getMyWordsLanguagesMock.mockResolvedValue([
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
    ]);
  });

  it('validates empty input and renders successful lookup results', async () => {
    lookupWordMock.mockResolvedValue({
      word: 'ocean',
      language: { code: 'en', name: 'English' },
      synonyms: ['sea', 'waters'],
      antonyms: ['land'],
      entries: [
        {
          partOfSpeech: 'noun',
          senses: [{ definition: 'A very large body of salt water.' }],
        },
      ],
    });

    render(<WordsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));
    expect(screen.getByText('Enter a word.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search word'), {
      target: { value: 'ocean' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));

    await waitFor(() => {
      expect(lookupWordMock).toHaveBeenCalledWith({
        languageCode: 'en',
        word: 'ocean',
      });
    });

    expect(await screen.findByText('ocean')).toBeInTheDocument();
    expect(screen.getByText('sea, waters')).toBeInTheDocument();
    expect(screen.getByText('land')).toBeInTheDocument();
  });

  it('shows an empty-result message when dictionary returns no match', async () => {
    lookupWordMock.mockResolvedValue(null);

    render(<WordsScreen />);
    await screen.findByRole('button', { name: 'en' });

    fireEvent.change(screen.getByPlaceholderText('Search word'), {
      target: { value: 'qwertyword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));

    expect(
      await screen.findByText(/No entry found for "qwertyword" in (English|en)\./i),
    ).toBeInTheDocument();
  });

  it('looks up a nearby word when pressed', async () => {
    lookupWordMock
      .mockResolvedValueOnce({
        word: 'ocean',
        language: { code: 'en', name: 'English' },
        synonyms: ['sea'],
        antonyms: [],
        nearbyWords: ['seaweed'],
        entries: [
          {
            partOfSpeech: 'noun',
            senses: [{ definition: 'A very large body of salt water.' }],
          },
        ],
      })
      .mockResolvedValueOnce({
        word: 'seaweed',
        language: { code: 'en', name: 'English' },
        synonyms: ['kelp'],
        antonyms: [],
        entries: [
          {
            partOfSpeech: 'noun',
            senses: [{ definition: 'Marine algae.' }],
          },
        ],
      });

    render(<WordsScreen />);

    fireEvent.change(screen.getByPlaceholderText('Search word'), {
      target: { value: 'ocean' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Look Up' }));

    const nearbyWordButton = await screen.findByRole('button', { name: 'seaweed' });
    fireEvent.click(nearbyWordButton);

    await waitFor(() => {
      expect(lookupWordMock).toHaveBeenNthCalledWith(2, {
        languageCode: 'en',
        word: 'seaweed',
      });
    });
  });
});
