import type { ModuleDefinition } from '@mylife/module-registry';

export const WORKOUTS_MODULE: ModuleDefinition = {
  id: 'workouts',
  name: 'MyWorkouts',
  tagline: 'Your AI workout companion',
  icon: '\u{1F4AA}',
  accentColor: '#EF4444',
  tier: 'premium',
  storageType: 'supabase',
  navigation: {
    tabs: [
      { key: 'today', label: 'Today', icon: 'zap' },
      { key: 'programs', label: 'Programs', icon: 'layers' },
      { key: 'history', label: 'History', icon: 'clock' },
      { key: 'stats', label: 'Stats', icon: 'trending-up' },
      { key: 'profile', label: 'Profile', icon: 'user' },
    ],
    screens: [
      { name: 'workout-detail', title: 'Workout' },
      { name: 'exercise-detail', title: 'Exercise' },
      { name: 'active-workout', title: 'In Progress' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: true,
  version: '0.1.0',
};
