import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsScreen from '../settings';

const pushMock = vi.fn();
const refreshEntitlementFromServerMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => ({ id: 'mock-db' }),
}));

vi.mock('../../../lib/entitlements', () => ({
  getModeConfig: () => ({
    mode: 'local_only',
    serverUrl: null,
  }),
  getStoredEntitlement: () => null,
  refreshEntitlementFromServer: (...args: unknown[]) =>
    refreshEntitlementFromServerMock(...args),
}));

describe('Hub SettingsScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshEntitlementFromServerMock.mockResolvedValue({ ok: true });
  });

  it('navigates to onboarding mode and self-host setup from buttons', () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Change Mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Self-Host Setup' }));

    expect(pushMock).toHaveBeenNthCalledWith(1, '/(hub)/onboarding-mode');
    expect(pushMock).toHaveBeenNthCalledWith(2, '/(hub)/self-host');
  });

  it('refreshes entitlement and shows success message', async () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(refreshEntitlementFromServerMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Entitlement refreshed.')).toBeInTheDocument();
    });
  });

  it('shows failure message when entitlement refresh fails', async () => {
    refreshEntitlementFromServerMock.mockResolvedValue({
      ok: false,
      reason: 'network_unreachable',
    });

    render(<SettingsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(
        screen.getByText('Refresh failed: network_unreachable'),
      ).toBeInTheDocument();
    });
  });
});
