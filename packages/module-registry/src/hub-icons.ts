/**
 * Lucide icon name mappings for each module.
 * Used by the hub launcher to render module icons.
 */
export const MODULE_ICONS: Record<string, string> = {
  books: 'book-open',
  budget: 'wallet',
  car: 'car',
  closet: 'shirt',
  cycle: 'moon',
  fast: 'timer',
  flash: 'zap',
  garden: 'sprout',
  habits: 'check-circle-2',
  health: 'heart-pulse',
  homes: 'home',
  journal: 'notebook-pen',
  mail: 'mail',
  meds: 'pill',
  mood: 'smile',
  notes: 'file-text',
  nutrition: 'utensils',
  pets: 'paw-print',
  recipes: 'chef-hat',
  rsvp: 'party-popper',
  stars: 'sparkles',
  subs: 'credit-card',
  surf: 'waves',
  trails: 'mountain',
  voice: 'mic',
  words: 'book-a',
  workouts: 'dumbbell',
};

/** Dock tab definitions for bottom bar */
export const DOCK_ITEMS = [
  { key: 'hub', label: 'Hub', icon: 'layout-grid' },
  { key: 'discover', label: 'Discover', icon: 'compass' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
] as const;
