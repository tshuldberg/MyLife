import type { ModuleId } from './types';

export type ModuleReleaseState = 'ga' | 'public_beta' | 'merged';

export const GA_MODULE_IDS: readonly ModuleId[] = [
  'books',
  'budget',
  'fast',
  'habits',
  'health',
  'meds',
  'recipes',
  'rsvp',
  'words',
] as const;

export const PUBLIC_BETA_MODULE_IDS: readonly ModuleId[] = [
  'car',
  'closet',
  'cycle',
  'flash',
  'forums',
  'garden',
  'homes',
  'journal',
  'mail',
  'market',
  'mood',
  'notes',
  'nutrition',
  'pets',
  'stars',
  'surf',
  'trails',
  'voice',
  'workouts',
] as const;

export const MERGED_MODULE_IDS: readonly ModuleId[] = ['subs'] as const;

export const USER_VISIBLE_MODULE_IDS: readonly ModuleId[] = [
  ...GA_MODULE_IDS,
  ...PUBLIC_BETA_MODULE_IDS,
] as const;

export const MODULE_RELEASE_STATES: Record<ModuleId, ModuleReleaseState> = {
  books: 'ga',
  budget: 'ga',
  car: 'public_beta',
  closet: 'public_beta',
  cycle: 'public_beta',
  fast: 'ga',
  flash: 'public_beta',
  forums: 'public_beta',
  garden: 'public_beta',
  habits: 'ga',
  health: 'ga',
  homes: 'public_beta',
  journal: 'public_beta',
  mail: 'public_beta',
  market: 'public_beta',
  meds: 'ga',
  mood: 'public_beta',
  notes: 'public_beta',
  nutrition: 'public_beta',
  pets: 'public_beta',
  recipes: 'ga',
  rsvp: 'ga',
  stars: 'public_beta',
  subs: 'merged',
  surf: 'public_beta',
  trails: 'public_beta',
  voice: 'public_beta',
  words: 'ga',
  workouts: 'public_beta',
};

export function getModuleReleaseState(moduleId: ModuleId): ModuleReleaseState {
  return MODULE_RELEASE_STATES[moduleId];
}

export function isGeneralAvailabilityModule(moduleId: ModuleId): boolean {
  return getModuleReleaseState(moduleId) === 'ga';
}

export function isPublicBetaModule(moduleId: ModuleId): boolean {
  return getModuleReleaseState(moduleId) === 'public_beta';
}

export function isMergedModule(moduleId: ModuleId): boolean {
  return getModuleReleaseState(moduleId) === 'merged';
}

export function isUserVisibleModule(moduleId: ModuleId): boolean {
  return !isMergedModule(moduleId);
}

export function getModuleReleaseLabel(moduleId: ModuleId): string {
  const releaseState = getModuleReleaseState(moduleId);
  switch (releaseState) {
    case 'ga':
      return 'GA';
    case 'public_beta':
      return 'BETA';
    case 'merged':
      return 'MERGED';
  }
}

export function getModuleReleaseDescription(moduleId: ModuleId): string {
  const releaseState = getModuleReleaseState(moduleId);
  switch (releaseState) {
    case 'ga':
      return 'Included in the production launch promise.';
    case 'public_beta':
      return 'Included at launch as a public beta.';
    case 'merged':
      return 'Folded into another module and not surfaced independently.';
  }
}
