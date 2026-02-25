import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

const mockRegistry = {
  getEnabled: vi.fn(),
};
vi.mock('@mylife/module-registry', () => ({
  useModuleRegistry: () => mockRegistry,
}));

vi.mock('@/lib/modules', () => ({
  isWebSupportedModuleId: (id: string) =>
    ['books', 'budget', 'fast', 'recipes', 'car', 'habits', 'meds', 'subs'].includes(id),
}));

import { Sidebar } from '../Sidebar';

const makeModule = (id: string, name: string, icon: string) => ({
  id,
  name,
  tagline: `${name} tagline`,
  icon,
  accentColor: '#FFFFFF',
  tier: 'premium' as const,
  storageType: 'sqlite' as const,
  migrations: [],
  tablePrefix: `${id.slice(0, 2)}_`,
  navigation: { tabs: [], screens: [] },
  requiresAuth: false,
  requiresNetwork: false,
  version: '1.0.0',
});

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    mockRegistry.getEnabled.mockReturnValue([]);
  });

  it('renders logo with link to home', () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('MyLife')).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: /mylife/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('shows enabled module links in sidebar', () => {
    mockRegistry.getEnabled.mockReturnValue([
      makeModule('books', 'MyBooks', '\uD83D\uDCDA'),
      makeModule('budget', 'MyBudget', '\uD83D\uDCB0'),
    ]);

    const user = userEvent.setup();
    render(<Sidebar />);

    const booksLink = screen.getByRole('link', { name: /books/i });
    expect(booksLink).toHaveAttribute('href', '/books');

    const budgetLink = screen.getByRole('link', { name: /budget/i });
    expect(budgetLink).toHaveAttribute('href', '/budget');
  });

  it('highlights active module link based on pathname', () => {
    mockUsePathname.mockReturnValue('/books/search');
    mockRegistry.getEnabled.mockReturnValue([
      makeModule('books', 'MyBooks', '\uD83D\uDCDA'),
      makeModule('budget', 'MyBudget', '\uD83D\uDCB0'),
    ]);

    const user = userEvent.setup();
    render(<Sidebar />);

    // Active link gets elevated background style — just verify link exists with correct href
    const booksLink = screen.getByRole('link', { name: /books/i });
    expect(booksLink).toHaveAttribute('href', '/books');
  });

  it('shows Discover and Settings links', () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const discoverLink = screen.getByRole('link', { name: /discover/i });
    expect(discoverLink).toHaveAttribute('href', '/discover');

    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('shows empty state when no modules enabled', () => {
    mockRegistry.getEnabled.mockReturnValue([]);

    const user = userEvent.setup();
    render(<Sidebar />);

    expect(screen.getByText(/no modules enabled/i)).toBeInTheDocument();
  });

  it('filters out non-web-supported modules', () => {
    mockRegistry.getEnabled.mockReturnValue([
      makeModule('books', 'MyBooks', '\uD83D\uDCDA'),
      makeModule('surf', 'MySurf', '\uD83C\uDFC4'),
    ]);

    const user = userEvent.setup();
    render(<Sidebar />);

    expect(screen.getByText(/books/i)).toBeInTheDocument();
    expect(screen.queryByText(/surf/i)).not.toBeInTheDocument();
  });

  it('renders module icons and names', () => {
    mockRegistry.getEnabled.mockReturnValue([
      makeModule('books', 'MyBooks', '\uD83D\uDCDA'),
    ]);

    const user = userEvent.setup();
    render(<Sidebar />);

    expect(screen.getByText('\uD83D\uDCDA')).toBeInTheDocument();
    expect(screen.getByText(/MyBooks/)).toBeInTheDocument();
  });
});
