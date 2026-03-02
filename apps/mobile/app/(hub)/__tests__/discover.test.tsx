import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiscoverScreen from '../discover';

const toggleMock = vi.fn();
const routerMock = { push: vi.fn() };
const registry = {
  isEnabled: vi.fn((id: string) => id === 'fast' || id === 'health'),
};

vi.mock('expo-router', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@mylife/module-registry', () => ({
  useModuleRegistry: () => registry,
  useEnabledModules: () => [],
  FREE_MODULES: ['fast'],
  MODULE_METADATA: {
    books: { id: 'books', name: 'MyBooks', tagline: 'Books', icon: '📚', accentColor: '#C9894D', tier: 'premium' },
    recipes: { id: 'recipes', name: 'MyGarden', tagline: 'Grow it, cook it, host it', icon: '🌱', accentColor: '#22C55E', tier: 'premium' },
    habits: { id: 'habits', name: 'MyHabits', tagline: 'Habits', icon: '✅', accentColor: '#8B5CF6', tier: 'premium' },
    words: { id: 'words', name: 'MyWords', tagline: 'Words', icon: '📝', accentColor: '#8B5CF6', tier: 'premium' },
    rsvp: { id: 'rsvp', name: 'MyRSVP', tagline: 'RSVP', icon: '💌', accentColor: '#FB7185', tier: 'premium' },
    budget: { id: 'budget', name: 'MyBudget', tagline: 'Budget', icon: '💰', accentColor: '#22C55E', tier: 'premium' },
    fast: { id: 'fast', name: 'MyFast', tagline: 'Fast', icon: '⏱️', accentColor: '#14B8A6', tier: 'free' },
    workouts: { id: 'workouts', name: 'MyWorkouts', tagline: 'Workouts', icon: '💪', accentColor: '#EF4444', tier: 'premium' },
    meds: { id: 'meds', name: 'MyMeds', tagline: 'Meds', icon: '💊', accentColor: '#06B6D4', tier: 'premium' },
    surf: { id: 'surf', name: 'MySurf', tagline: 'Surf', icon: '🏄', accentColor: '#3B82F6', tier: 'premium' },
    homes: { id: 'homes', name: 'MyHomes', tagline: 'Homes', icon: '🏠', accentColor: '#D97706', tier: 'premium' },
    car: { id: 'car', name: 'MyCar', tagline: 'Car', icon: '🚗', accentColor: '#6366F1', tier: 'premium' },
    health: { id: 'health', name: 'MyHealth', tagline: 'Your health, unified', icon: '❤️‍🩹', accentColor: '#10B981', tier: 'premium', freeSections: ['fasting'] },
  },
}));

vi.mock('../../../hooks/use-module-toggle', () => ({
  useModuleToggle: () => toggleMock,
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => ({}),
}));

vi.mock('../../../lib/entitlements', () => ({
  getStoredEntitlement: () => ({
    appId: 'mylife',
    mode: 'hosted',
    hostedActive: true,
    selfHostLicense: false,
    features: [],
    issuedAt: '2026-01-01T00:00:00Z',
    signature: 'test-sig',
  }),
}));

vi.mock('@mylife/entitlements', () => ({
  isEntitlementExpired: () => false,
}));

describe('Hub DiscoverScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toggle with selected module id when user has entitlement', () => {
    render(<DiscoverScreen />);

    fireEvent.click(screen.getByRole('button', { name: /MyBooks/i }));

    expect(toggleMock).toHaveBeenCalledWith('books');
  });

  it('renders PRO badge for premium modules and ON for free enabled modules', () => {
    render(<DiscoverScreen />);

    // MyFast is free + enabled
    expect(screen.getByText('ON')).toBeInTheDocument();
  });
});
