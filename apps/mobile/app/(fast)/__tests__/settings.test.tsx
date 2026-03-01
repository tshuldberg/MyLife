import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FastSettingsScreen from '../settings';

const mockDb = { id: 'mock-db' };

const getSettingMock = vi.fn();
const setSettingMock = vi.fn();
const getNotificationPreferencesMock = vi.fn();
const setNotificationPreferenceMock = vi.fn();
const listGoalsMock = vi.fn();
const listGoalProgressMock = vi.fn();
const createGoalMock = vi.fn();
const upsertGoalMock = vi.fn();
const refreshGoalProgressMock = vi.fn();
const setWaterTargetMock = vi.fn();
const probeHealthSyncStatusMock = vi.fn();
const syncHealthDataMock = vi.fn();

vi.mock('@mylife/fast', () => ({
  getSetting: (...args: unknown[]) => getSettingMock(...args),
  setSetting: (...args: unknown[]) => setSettingMock(...args),
  getNotificationPreferences: (...args: unknown[]) => getNotificationPreferencesMock(...args),
  setNotificationPreference: (...args: unknown[]) => setNotificationPreferenceMock(...args),
  listGoals: (...args: unknown[]) => listGoalsMock(...args),
  listGoalProgress: (...args: unknown[]) => listGoalProgressMock(...args),
  createGoal: (...args: unknown[]) => createGoalMock(...args),
  upsertGoal: (...args: unknown[]) => upsertGoalMock(...args),
  refreshGoalProgress: (...args: unknown[]) => refreshGoalProgressMock(...args),
  setWaterTarget: (...args: unknown[]) => setWaterTargetMock(...args),
}));

vi.mock('../../../lib/fast-health-sync', () => ({
  getHealthSyncStatus: () => ({
    available: true,
    platform: 'ios',
    reason: 'Health sync is available.',
  }),
  probeHealthSyncStatus: (...args: unknown[]) => probeHealthSyncStatusMock(...args),
  syncHealthData: (...args: unknown[]) => syncHealthDataMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

describe('FastSettingsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingMock.mockImplementation((_db: unknown, key: string) => {
      if (key === 'defaultProtocol') return '16:8';
      if (key === 'healthSyncEnabled') return '0';
      if (key === 'healthReadWeight') return '0';
      if (key === 'healthWriteFasts') return '0';
      if (key === 'waterDailyTarget') return '8';
      return null;
    });
    getNotificationPreferencesMock.mockReturnValue({
      fastStart: false,
      progress25: false,
      progress50: false,
      progress75: false,
      fastComplete: false,
    });
    listGoalsMock.mockReturnValue([]);
    listGoalProgressMock.mockReturnValue([]);
    probeHealthSyncStatusMock.mockResolvedValue({
      available: true,
      platform: 'ios',
      reason: 'Health sync is available.',
    });
    syncHealthDataMock.mockResolvedValue({
      available: true,
      platform: 'ios',
      importedWeightEntries: 0,
      exportedFasts: 0,
      message: 'Synced.',
    });
  });

  it('saves updated protocol, notification, goal, and health settings', () => {
    render(<FastSettingsScreen />);

    fireEvent.change(screen.getByPlaceholderText('16:8'), {
      target: { value: '18:6' },
    });

    const switches = screen.getAllByRole('checkbox');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[5]);
    fireEvent.click(switches[6]);
    fireEvent.click(switches[7]);

    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'defaultProtocol', '18:6');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'healthSyncEnabled', '1');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'healthReadWeight', '1');
    expect(setSettingMock).toHaveBeenCalledWith(mockDb, 'healthWriteFasts', '1');
    expect(setNotificationPreferenceMock).toHaveBeenCalledWith(mockDb, 'fastStart', true);
    expect(createGoalMock).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        type: 'fasts_per_week',
      }),
    );
    expect(refreshGoalProgressMock).toHaveBeenCalledWith(mockDb);
    expect(upsertGoalMock).not.toHaveBeenCalled();
  });
});
