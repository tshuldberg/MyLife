import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  enableModuleAction,
  disableModuleAction,
} from '../actions';
import DiscoverPage from '../discover/page';

const registry = {
  isEnabled: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
};

vi.mock('../actions', () => ({
  enableModuleAction: vi.fn().mockResolvedValue(undefined),
  disableModuleAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@mylife/module-registry', () => ({
  useModuleRegistry: () => registry,
  useEnabledModules: () => [],
  MODULE_METADATA: {
    books: {
      id: 'books',
      name: 'MyBooks',
      tagline: 'Track your reading life',
      icon: '📚',
      accentColor: '#C9894D',
      tier: 'premium',
      storageType: 'sqlite',
      navigation: { tabs: [], screens: [] },
      requiresAuth: false,
      requiresNetwork: false,
      version: '0.1.0',
    },
  },
}));

vi.mock('@/lib/modules', () => ({
  WEB_SUPPORTED_MODULE_IDS: ['books'],
}));

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables a module when Enable is clicked', async () => {
    registry.isEnabled.mockReturnValue(false);
    const user = userEvent.setup();

    render(<DiscoverPage />);
    await user.click(screen.getByRole('button', { name: 'Enable' }));

    expect(enableModuleAction).toHaveBeenCalledWith('books');
    expect(registry.enable).toHaveBeenCalledWith('books');
    expect(disableModuleAction).not.toHaveBeenCalled();
  });

  it('disables a module when Enabled is clicked', async () => {
    registry.isEnabled.mockReturnValue(true);
    const user = userEvent.setup();

    render(<DiscoverPage />);
    await user.click(screen.getByRole('button', { name: 'Enabled' }));

    expect(disableModuleAction).toHaveBeenCalledWith('books');
    expect(registry.disable).toHaveBeenCalledWith('books');
    expect(enableModuleAction).not.toHaveBeenCalled();
  });
});
