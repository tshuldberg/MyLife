import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiscoverScreen from '../discover';

const toggleMock = vi.fn();
const registry = {
  isEnabled: vi.fn((id: string) => id === 'books'),
};

vi.mock('@mylife/module-registry', () => ({
  useModuleRegistry: () => registry,
  useEnabledModules: () => [],
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
  },
}));

vi.mock('../../../hooks/use-module-toggle', () => ({
  useModuleToggle: () => toggleMock,
}));

describe('Hub DiscoverScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toggle with selected module id when a module row is pressed', () => {
    render(<DiscoverScreen />);

    fireEvent.click(screen.getByRole('button', { name: /MyBooks/i }));

    expect(toggleMock).toHaveBeenCalledWith('books');
  });

  it('renders current enabled/disabled statuses from registry state', () => {
    render(<DiscoverScreen />);

    expect(screen.getByText('ON')).toBeInTheDocument();
    expect(screen.getAllByText('OFF').length).toBeGreaterThan(0);
  });
});
