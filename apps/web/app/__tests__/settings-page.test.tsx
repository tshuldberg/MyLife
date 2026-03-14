import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../settings/page';
import {
  getModeConfigAction,
  getStoredEntitlementAction,
  refreshStoredEntitlementAction,
} from '../actions';

const registry = {
  getEnabled: vi.fn(),
  getAll: vi.fn(),
  size: 3,
};

vi.mock('@mylife/module-registry', () => ({
  useModuleRegistry: () => registry,
  GA_MODULE_IDS: ['books', 'budget', 'fast', 'habits', 'health', 'meds', 'recipes', 'rsvp', 'words'],
  PUBLIC_BETA_MODULE_IDS: [
    'car',
    'closet',
    'cycle',
    'flash',
    'garden',
    'homes',
    'journal',
    'mail',
    'mood',
    'notes',
    'nutrition',
    'pets',
    'stars',
    'surf',
    'trails',
    'voice',
    'workouts',
  ],
  isGeneralAvailabilityModule: (id: string) => ['books', 'budget'].includes(id),
}));

vi.mock('../actions', () => ({
  getModeConfigAction: vi.fn(),
  getStoredEntitlementAction: vi.fn(),
  refreshStoredEntitlementAction: vi.fn(),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registry.getEnabled.mockReturnValue([
      {
        id: 'books',
        name: 'MyBooks',
        icon: '📚',
        version: '0.1.0',
      },
    ]);
    registry.getAll.mockReturnValue([
      { id: 'fast', tier: 'free' },
      { id: 'books', tier: 'premium' },
    ]);
    registry.size = 2;
  });

  it('loads mode and entitlement data on mount', async () => {
    vi.mocked(getModeConfigAction).mockResolvedValue({
      mode: 'local_only',
      serverUrl: null,
    });
    vi.mocked(getStoredEntitlementAction).mockResolvedValue({
      appId: 'mylife',
      mode: 'local_only',
      hostedActive: false,
      selfHostLicense: true,
      updatePackYear: 2027,
      features: ['books'],
      issuedAt: '2026-01-01T00:00:00.000Z',
      signature: 'sig',
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(getModeConfigAction).toHaveBeenCalledTimes(1);
      expect(getStoredEntitlementAction).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('LOCAL ONLY')).toBeInTheDocument();
    expect(screen.getByText('LICENSED')).toBeInTheDocument();
    expect(screen.getByText('2027')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upgrade' })).toHaveAttribute(
      'href',
      '/discover',
    );
  });

  it('refreshes entitlement and reloads state when refresh succeeds', async () => {
    vi.mocked(getModeConfigAction).mockResolvedValue({
      mode: 'hosted',
      serverUrl: 'https://home.example.com',
    });
    vi.mocked(getStoredEntitlementAction).mockResolvedValue(null);
    vi.mocked(refreshStoredEntitlementAction).mockResolvedValue({
      ok: true,
      message: 'Entitlement refreshed successfully.',
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(getModeConfigAction).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(refreshStoredEntitlementAction).toHaveBeenCalledTimes(1);
      expect(getModeConfigAction).toHaveBeenCalledTimes(2);
      expect(getStoredEntitlementAction).toHaveBeenCalledTimes(2);
    });

    expect(
      screen.getByText('Entitlement refreshed successfully.'),
    ).toBeInTheDocument();
  });

  it('shows refresh failure message without reloading entitlement state', async () => {
    vi.mocked(getModeConfigAction).mockResolvedValue({
      mode: 'local_only',
      serverUrl: null,
    });
    vi.mocked(getStoredEntitlementAction).mockResolvedValue(null);
    vi.mocked(refreshStoredEntitlementAction).mockResolvedValue({
      ok: false,
      message: 'Sync request failed. Check network connectivity and endpoint availability.',
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(getModeConfigAction).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(refreshStoredEntitlementAction).toHaveBeenCalledTimes(1);
      expect(getModeConfigAction).toHaveBeenCalledTimes(1);
      expect(getStoredEntitlementAction).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(
        'Sync request failed. Check network connectivity and endpoint availability.',
      ),
    ).toBeInTheDocument();
  });

  it('describes the GA launch promise in subscription copy', async () => {
    vi.mocked(getModeConfigAction).mockResolvedValue({
      mode: 'local_only',
      serverUrl: null,
    });
    vi.mocked(getStoredEntitlementAction).mockResolvedValue(null);

    render(<SettingsPage />);

    await waitFor(() => {
      expect(getModeConfigAction).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/guarantees 9 suite GA modules/i)).toBeInTheDocument();
    expect(
      screen.getByText(/17\s*more modules are available in public beta/i),
    ).toBeInTheDocument();
  });
});
