import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardScreen from '../index';

let enabledModules: Array<{
  id: string;
  name: string;
}> = [];

vi.mock('@mylife/module-registry', () => ({
  useEnabledModules: () => enabledModules,
}));

vi.mock('../../../components/ModuleCard', () => ({
  ModuleCard: ({ module }: { module: { name: string } }) => (
    <div>{module.name}</div>
  ),
}));

describe('Hub DashboardScreen (mobile)', () => {
  it('shows welcome empty state when no modules are enabled', () => {
    enabledModules = [];
    render(<DashboardScreen />);

    expect(screen.getByText('Welcome to MyLife')).toBeInTheDocument();
    expect(
      screen.getByText(/Head to Discover to enable your first module/i),
    ).toBeInTheDocument();
  });

  it('renders enabled module cards when modules exist', () => {
    enabledModules = [
      { id: 'books', name: 'MyBooks' },
      { id: 'fast', name: 'MyFast' },
    ];

    render(<DashboardScreen />);

    expect(screen.getByText('MyBooks')).toBeInTheDocument();
    expect(screen.getByText('MyFast')).toBeInTheDocument();
  });
});
