import React from 'react';
import { render, screen } from '@testing-library/react';
import type { ModuleDefinition } from '@mylife/module-registry';
import HubDashboard from '../page';

let enabledModules: ModuleDefinition[] = [];

vi.mock('@mylife/module-registry', () => ({
  useModuleRegistry: () => ({}),
  useEnabledModules: () => enabledModules,
}));

describe('HubDashboard', () => {
  beforeEach(() => {
    enabledModules = [];
  });

  it('shows empty state when no modules are enabled', () => {
    render(<HubDashboard />);

    expect(screen.getByText('No modules enabled yet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Discover' }),
    ).toHaveAttribute('href', '/discover');
  });

  it('renders enabled module cards and active count', () => {
    enabledModules = [
      {
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
    ] as ModuleDefinition[];

    render(<HubDashboard />);

    expect(screen.getByText('1 module active')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /MyBooks/i })).toHaveAttribute(
      'href',
      '/books',
    );
  });

  it('filters out modules that are not web-supported', () => {
    const unsupportedModule = {
      id: 'voice',
      name: 'MyVoice',
      tagline: 'Private voice notes',
      icon: '🎙️',
      accentColor: '#9CA3AF',
      tier: 'premium',
      storageType: 'sqlite',
      navigation: { tabs: [], screens: [] },
      requiresAuth: false,
      requiresNetwork: false,
      version: '0.1.0',
    } as unknown as ModuleDefinition;

    enabledModules = [
      {
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
      unsupportedModule,
    ] as ModuleDefinition[];

    render(<HubDashboard />);

    expect(screen.getByText('1 module active')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /MyVoice/i })).not.toBeInTheDocument();
  });
});
