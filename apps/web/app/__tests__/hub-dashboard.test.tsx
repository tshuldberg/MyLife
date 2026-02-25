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
      {
        id: 'surf',
        name: 'MySurf',
        tagline: 'Surf forecasts and spot intel',
        icon: '🏄',
        accentColor: '#3B82F6',
        tier: 'premium',
        storageType: 'supabase',
        navigation: { tabs: [], screens: [] },
        requiresAuth: true,
        requiresNetwork: true,
        version: '0.1.0',
      },
    ] as ModuleDefinition[];

    render(<HubDashboard />);

    expect(screen.getByText('1 module active')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /MySurf/i })).not.toBeInTheDocument();
  });
});
