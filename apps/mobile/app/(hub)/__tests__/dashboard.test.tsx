import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppSelectorScreen from '../index';

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@mylife/module-registry', () => ({
  USER_VISIBLE_MODULE_IDS: ['books', 'fast'],
  MODULE_METADATA: {
    books: { id: 'books', name: 'MyBooks', tagline: 'Books', icon: '📚', accentColor: '#C9894D' },
    fast: { id: 'fast', name: 'MyFast', tagline: 'Fast', icon: '⏱️', accentColor: '#14B8A6' },
  },
  MODULE_ICONS: {
    books: 'book',
    fast: 'timer',
  },
  DOCK_ITEMS: [
    { key: 'hub', label: 'Hub', icon: 'home' },
    { key: 'discover', label: 'Discover', icon: 'sparkles' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ],
}));

describe('Hub AppSelectorScreen (mobile)', () => {
  it('shows the search prompt, module labels, and dock items', () => {
    render(<AppSelectorScreen />);

    expect(screen.getByText('Search modules...')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('Hub')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });
});
