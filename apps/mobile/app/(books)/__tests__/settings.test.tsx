import { fireEvent, render, screen } from '@testing-library/react';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BooksSettingsScreen from '../settings';

const saveGoalMock = vi.fn();
const refreshGoalMock = vi.fn();
const dbExecuteMock = vi.fn();
const dbTransactionMock = vi.fn((fn: () => void) => fn());
const dbQueryMock = vi.fn(() => []);
const refreshBooksMock = vi.fn();
const dbMock = {
  transaction: dbTransactionMock,
  execute: dbExecuteMock,
  query: dbQueryMock,
};

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(),
}));

vi.mock('expo-file-system', () => ({
  cacheDirectory: '/tmp/',
  documentDirectory: '/tmp/',
  EncodingType: { UTF8: 'utf8' },
  readAsStringAsync: vi.fn(),
  writeAsStringAsync: vi.fn(),
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(async () => false),
  shareAsync: vi.fn(),
}));

vi.mock('../../../hooks/books/use-goals', () => ({
  useGoal: () => ({
    goal: { target_books: 24, year: 2026 },
    save: saveGoalMock,
    refresh: refreshGoalMock,
  }),
}));

vi.mock('../../../hooks/books/use-books', () => ({
  useBooks: () => ({
    books: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }],
    refresh: refreshBooksMock,
  }),
}));

vi.mock('../../../hooks/books/use-shelves', () => ({
  useShelves: () => ({
    shelves: [
      { id: 's1', slug: 'want-to-read', name: 'Want to Read' },
      { id: 's2', slug: 'finished', name: 'Finished' },
    ],
  }),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => dbMock,
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('BooksSettingsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows total books and updates yearly goal through prompt', () => {
    vi.mocked(Alert.prompt).mockImplementation(
      (
        _title?: string,
        _message?: string,
        callback?: ((text: string) => void) | undefined,
      ) => {
        callback?.('30');
      },
    );

    render(<BooksSettingsScreen />);

    expect(screen.getByText('Total books')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /2026 Reading Goal/i }));
    expect(saveGoalMock).toHaveBeenCalledWith(30, null);
  });

  it('erases book data through destructive confirmation action', () => {
    render(<BooksSettingsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Erase all book data' }));

    expect(Alert.alert).toHaveBeenCalled();
    const args = vi.mocked(Alert.alert).mock.calls[0];
    const buttons = args[2] as Array<{ text: string; onPress?: () => void }>;
    const confirm = buttons.find((button) => button.text === 'Erase Everything');

    expect(confirm).toBeDefined();
    confirm?.onPress?.();

    expect(dbTransactionMock).toHaveBeenCalledTimes(1);
    expect(dbExecuteMock).toHaveBeenCalled();
    expect(vi.mocked(Alert.alert)).toHaveBeenLastCalledWith(
      'Done',
      'All book data has been erased.',
    );
  });
});
