import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecipesScreen from '../index';

const mockDb = { id: 'mock-db' };

const countRecipesMock = vi.fn();
const createRecipeMock = vi.fn();
const deleteRecipeMock = vi.fn();
const getRecipesMock = vi.fn();
const updateRecipeMock = vi.fn();

vi.mock('@mylife/recipes', () => ({
  countRecipes: (...args: unknown[]) => countRecipesMock(...args),
  createRecipe: (...args: unknown[]) => createRecipeMock(...args),
  deleteRecipe: (...args: unknown[]) => deleteRecipeMock(...args),
  getRecipes: (...args: unknown[]) => getRecipesMock(...args),
  updateRecipe: (...args: unknown[]) => updateRecipeMock(...args),
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('../../../lib/uuid', () => ({
  uuid: () => 'uuid-123',
}));

describe('RecipesScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    countRecipesMock.mockReturnValue(1);
    getRecipesMock.mockReturnValue([
      {
        id: 'recipe-1',
        title: 'Tomato Soup',
        difficulty: 'easy',
        rating: 3,
        is_favorite: 0,
      },
    ]);
  });

  it('loads recipes, creates one, and applies search', async () => {
    render(<RecipesScreen />);

    await waitFor(() => {
      expect(getRecipesMock).toHaveBeenCalledWith(mockDb, undefined);
    });

    fireEvent.change(screen.getByPlaceholderText('Recipe title'), {
      target: { value: 'Pancakes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'medium' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(createRecipeMock).toHaveBeenCalledWith(
      mockDb,
      'uuid-123',
      expect.objectContaining({
        title: 'Pancakes',
        difficulty: 'medium',
      }),
    );

    fireEvent.change(screen.getByPlaceholderText('Find recipes'), {
      target: { value: 'soup' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(getRecipesMock).toHaveBeenLastCalledWith(mockDb, { search: 'soup' });
  });

  it('supports favorite toggle, edit/save, and delete', async () => {
    render(<RecipesScreen />);

    await screen.findByText('Tomato Soup');

    fireEvent.click(screen.getByRole('button', { name: '☆' }));
    expect(updateRecipeMock).toHaveBeenCalledWith(
      mockDb,
      'recipe-1',
      { is_favorite: 1 },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Tomato Bisque' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateRecipeMock).toHaveBeenCalledWith(
      mockDb,
      'recipe-1',
      expect.objectContaining({
        title: 'Tomato Bisque',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteRecipeMock).toHaveBeenCalledWith(mockDb, 'recipe-1');
  });
});
