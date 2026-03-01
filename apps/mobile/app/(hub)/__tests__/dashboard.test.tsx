import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppSelectorScreen from '../index';

vi.mock('@mylife/module-registry', () => ({
  MODULE_IDS: ['books', 'fast'],
  MODULE_METADATA: {
    books: { id: 'books', name: 'MyBooks', tagline: 'Books', icon: '📚' },
    fast: { id: 'fast', name: 'MyFast', tagline: 'Fast', icon: '⏱️' },
  },
}));

vi.mock('../../../components/ModuleCard', () => ({
  ModuleCard: ({ module }: { module: { name: string } }) => (
    <div>{module.name}</div>
  ),
}));

describe('Hub AppSelectorScreen (mobile)', () => {
  it('shows the selector heading and app cards', () => {
    render(<AppSelectorScreen />);

    expect(screen.getByText('MyLife')).toBeInTheDocument();
    expect(screen.getByText('Choose an app to open.')).toBeInTheDocument();
    expect(screen.getByText('MyBooks')).toBeInTheDocument();
    expect(screen.getByText('MyFast')).toBeInTheDocument();
  });
});
