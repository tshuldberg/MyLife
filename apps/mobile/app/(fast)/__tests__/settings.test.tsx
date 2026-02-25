import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FastSettingsScreen from '../settings';

const mockDb = { id: 'mock-db' };

const getSettingMock = vi.fn();
const setSettingMock = vi.fn();

vi.mock('@mylife/fast', () => ({
  getSetting: (...args: unknown[]) => getSettingMock(...args),
  setSetting: (...args: unknown[]) => setSettingMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

describe('FastSettingsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockImplementation((_db: unknown, key: string) => {
      if (key === 'defaultProtocol') return '16:8';
      if (key === 'notifyFastComplete') return '1';
      if (key === 'notifyEatingWindowClosing') return '0';
      return null;
    });
  });

  it('saves default protocol and notification settings', () => {
    render(<FastSettingsScreen />);

    fireEvent.change(screen.getByPlaceholderText('16:8'), {
      target: { value: '18:6' },
    });

    const switches = screen.getAllByRole('checkbox');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'defaultProtocol', '18:6');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'notifyFastComplete', '0');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'notifyEatingWindowClosing', '1');
  });
});
