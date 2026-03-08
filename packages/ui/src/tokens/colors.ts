// Cool Obsidian theme -- inspired by iOS glass morphism
export const colors = {
  // Base theme (Cool Obsidian)
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1A1A24',
  text: '#F0F0F5',
  textSecondary: 'rgba(240,240,245,0.65)',
  textTertiary: 'rgba(240,240,245,0.35)',
  border: 'rgba(255,255,255,0.06)',
  danger: '#FF453A',
  success: '#30D158',

  // Contextual accent (set by module theme)
  accent: '#3B82F6',

  // Glass morphism
  glass: 'rgba(255,255,255,0.04)',
  glassStrong: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.10)',

  // Per-module accent colors (all 27)
  modules: {
    books: '#C9894D',
    budget: '#22C55E',
    car: '#6366F1',
    closet: '#E879A8',
    cycle: '#F472B6',
    fast: '#14B8A6',
    flash: '#FBBF24',
    garden: '#22C55E',
    habits: '#8B5CF6',
    health: '#10B981',
    homes: '#D97706',
    journal: '#A78BFA',
    mail: '#3B82F6',
    meds: '#06B6D4',
    mood: '#FB923C',
    notes: '#64748B',
    nutrition: '#F97316',
    pets: '#F59E0B',
    recipes: '#F97316',
    rsvp: '#FB7185',
    stars: '#8B5CF6',
    subs: '#10B981',
    surf: '#3B82F6',
    trails: '#65A30D',
    voice: '#EF4444',
    words: '#0EA5E9',
    workouts: '#EF4444',
  },
} as const;

export type ModuleName = keyof typeof colors.modules;
