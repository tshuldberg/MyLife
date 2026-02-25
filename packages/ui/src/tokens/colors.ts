export const colors = {
  // Base theme
  background: '#0E0C09',
  surface: '#1A1814',
  surfaceElevated: '#23201A',
  text: '#F4EDE2',
  textSecondary: '#A99E8E',
  textTertiary: '#6B6155',
  border: '#2A2520',
  danger: '#CC5555',
  success: '#5BA55B',

  // Contextual accent (set by module theme, defaults to books)
  accent: '#C9894D',

  // Books-domain semantic colors
  star: '#E8B84B',
  starEmpty: '#3A352D',
  shelf: '#2C6B50',

  // Per-module accent colors
  modules: {
    books: '#C9894D',
    budget: '#22C55E',
    fast: '#14B8A6',
    recipes: '#F97316',
    surf: '#3B82F6',
    workouts: '#EF4444',
    homes: '#D97706',
    car: '#6366F1',
    habits: '#8B5CF6',
    meds: '#06B6D4',
    subs: '#EC4899',
  },
} as const;

export type ModuleName = keyof typeof colors.modules;
