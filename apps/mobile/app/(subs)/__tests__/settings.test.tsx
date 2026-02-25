import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubsSettingsScreen from '../settings';

const mockDb = { id: 'mock-db' };

const getSettingMock = vi.fn();
const setSettingMock = vi.fn();

vi.mock('@mylife/subs', () => ({
  getSetting: (...args: unknown[]) => getSettingMock(...args),
  setSetting: (...args: unknown[]) => setSettingMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

describe('SubsSettingsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockImplementation((_db: unknown, key: string) => {
      if (key === 'default_notify_days') return '1';
      if (key === 'default_currency') return 'usd';
      if (key === 'renewal_reminders') return '1';
      return null;
    });
  });

  it('saves default values and notification preference', () => {
    render(<SubsSettingsScreen />);

    fireEvent.change(screen.getByPlaceholderText('1'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText('USD'), {
      target: { value: 'eur' },
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'default_notify_days', '3');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'default_currency', 'EUR');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'renewal_reminders', '0');
  });
});
