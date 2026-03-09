import type { ModuleId } from '@mylife/module-registry';

export const WEB_SUPPORTED_MODULE_IDS: readonly ModuleId[] = [
  'books',
  'budget',
  'closet',
  'cycle',
  'fast',
  'flash',
  'garden',
  'recipes',
  'rsvp',
  'stars',
  'surf',
  'workouts',
  'homes',
  'car',
  'habits',
  'journal',
  'mail',
  'meds',
  'mood',
  'notes',
  'nutrition',
  'pets',
  'trails',
  'voice',
  'words',
];

const SUPPORTED_MODULE_ID_SET = new Set<string>(WEB_SUPPORTED_MODULE_IDS);

export function isWebSupportedModuleId(moduleId: string): moduleId is ModuleId {
  return SUPPORTED_MODULE_ID_SET.has(moduleId);
}
