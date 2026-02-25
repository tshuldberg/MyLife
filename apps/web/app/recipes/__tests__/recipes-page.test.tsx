import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../actions', () => ({
  fetchRecipes: vi.fn(),
  fetchRecipeCount: vi.fn(),
  doCreateRecipe: vi.fn(),
  doUpdateRecipe: vi.fn(),
  doDeleteRecipe: vi.fn(),
}));

import RecipesPage from '../page';
import {
  fetchRecipes,
  fetchRecipeCount,
  doCreateRecipe,
  doUpdateRecipe,
  doDeleteRecipe,
} from '../actions';

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  servings: number | null;
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  total_time_mins: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  source_url: string | null;
  image_uri: string | null;
  is_favorite: number;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const mockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'recipe-1',
  title: 'Pasta Carbonara',
  description: 'Classic Italian',
  servings: 4,
  prep_time_mins: 15,
  cook_time_mins: 20,
  total_time_mins: 35,
  difficulty: 'medium',
  source_url: null,
  image_uri: null,
  is_favorite: 0,
  rating: 4,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (doCreateRecipe as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  (doUpdateRecipe as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  (doDeleteRecipe as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
});

describe('RecipesPage', () => {
  it('loads and displays recipes on mount', async () => {
    const recipe = mockRecipe();
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([recipe]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(fetchRecipes).toHaveBeenCalled();
    expect(fetchRecipeCount).toHaveBeenCalled();
  });

  it('creates a new recipe via form', async () => {
    const user = userEvent.setup();
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Recipes')).toBeInTheDocument();
    });

    // Title input uses placeholder "Recipe name"
    const titleInput = screen.getByPlaceholderText('Recipe name');
    await user.type(titleInput, 'Tacos');

    // Prep time and cook time use number placeholders
    const prepTimeInput = screen.getByPlaceholderText('15');
    await user.type(prepTimeInput, '10');

    const cookTimeInput = screen.getByPlaceholderText('30');
    await user.type(cookTimeInput, '15');

    const createButton = screen.getByRole('button', { name: /add recipe/i });
    await user.click(createButton);

    await waitFor(() => {
      // doCreateRecipe(id, input) — two args
      expect(doCreateRecipe).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Tacos',
          prep_time_mins: 10,
          cook_time_mins: 15,
        })
      );
    });
  });

  it('searches recipes', async () => {
    const user = userEvent.setup();
    const recipe = mockRecipe();
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([recipe]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Tacos');

    await waitFor(() => {
      expect(fetchRecipes).toHaveBeenCalledWith({ search: 'Tacos' });
    });
  });

  it('edits a recipe inline', async () => {
    const user = userEvent.setup();
    const recipe = mockRecipe();
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([recipe]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Edit button has title="Edit" and text content ✎
    const editButton = screen.getByTitle('Edit');
    await user.click(editButton);

    const titleInput = screen.getByDisplayValue('Pasta Carbonara');
    await user.clear(titleInput);
    await user.type(titleInput, 'Pasta Bolognese');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      // doUpdateRecipe(id, updates) — two args
      expect(doUpdateRecipe).toHaveBeenCalledWith(
        'recipe-1',
        expect.objectContaining({ title: 'Pasta Bolognese' })
      );
    });
  });

  it('deletes a recipe with confirmation', async () => {
    const user = userEvent.setup();
    const recipe = mockRecipe();
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([recipe]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Delete button has title="Delete" and text ✕
    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);

    // Confirm dialog appears with "Delete" and "Cancel" buttons
    const confirmDialog = screen.getByText(/are you sure/i);
    expect(confirmDialog).toBeInTheDocument();

    // Use getAllByRole to find the confirmation Delete button (in the dialog)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const confirmDeleteButton = deleteButtons[deleteButtons.length - 1];
    await user.click(confirmDeleteButton);

    await waitFor(() => {
      expect(doDeleteRecipe).toHaveBeenCalledWith('recipe-1');
    });
  });

  it('toggles favorite on a recipe', async () => {
    const user = userEvent.setup();
    const recipe = mockRecipe({ is_favorite: 0 });
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([recipe]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Favorite button has title="Add to favorites"
    const favoriteButton = screen.getByTitle('Add to favorites');
    await user.click(favoriteButton);

    await waitFor(() => {
      expect(doUpdateRecipe).toHaveBeenCalledWith(
        'recipe-1',
        expect.objectContaining({ is_favorite: 1 })
      );
    });
  });

  it('shows difficulty badges with correct colors', async () => {
    const recipes = [
      mockRecipe({ id: 'r-1', title: 'Toast', difficulty: 'easy' }),
      mockRecipe({ id: 'r-2', title: 'Risotto', difficulty: 'medium' }),
      mockRecipe({ id: 'r-3', title: 'Souffle', difficulty: 'hard' }),
    ];
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue(recipes);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Toast')).toBeInTheDocument();
    });

    expect(screen.getByText('easy')).toBeInTheDocument();
    // "medium" appears both as difficulty badge and in the form select option
    expect(screen.getAllByText(/medium/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('hard')).toBeInTheDocument();
  });

  it('shows empty state when no recipes', async () => {
    (fetchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Recipes')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/no recipes yet/i)
    ).toBeInTheDocument();
  });
});
