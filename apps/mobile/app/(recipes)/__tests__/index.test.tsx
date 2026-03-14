import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecipesHomeScreen from '../index';

const mockDb = { id: 'mock-db' };

const countRecipesMock = vi.fn();
const getRecipesMock = vi.fn();
const getMealPlanWeekMock = vi.fn();
const getShoppingListsMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@mylife/recipes', () => ({
  countRecipes: (...args: unknown[]) => countRecipesMock(...args),
  getRecipes: (...args: unknown[]) => getRecipesMock(...args),
  getMealPlanWeek: (...args: unknown[]) => getMealPlanWeekMock(...args),
  getShoppingLists: (...args: unknown[]) => getShoppingListsMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

describe('RecipesHomeScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    countRecipesMock.mockReturnValue(3);
    getRecipesMock.mockReturnValue([
      {
        id: 'recipe-1',
        title: 'Tomato Soup',
        difficulty: 'easy',
        rating: 3,
        is_favorite: 0,
        total_time_mins: 30,
      },
    ]);
    getMealPlanWeekMock.mockReturnValue([]);
    getShoppingListsMock.mockReturnValue([]);
  });

  it('loads recipe count and recent recipes', async () => {
    render(<RecipesHomeScreen />);

    await waitFor(() => {
      expect(countRecipesMock).toHaveBeenCalledWith(mockDb);
    });

    expect(getRecipesMock).toHaveBeenCalledWith(mockDb, { limit: 5 });
    expect(getMealPlanWeekMock).toHaveBeenCalled();
    expect(getShoppingListsMock).toHaveBeenCalledWith(mockDb, true);
  });
});
