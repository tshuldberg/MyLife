import type { ModuleId } from '@mylife/module-registry';

export const WEB_SUPPORTED_MODULE_IDS: readonly ModuleId[] = [
  'books',
  'budget',
  'fast',
  'recipes',
  'rsvp',
  'surf',
  'workouts',
  'homes',
  'car',
  'habits',
  'meds',
  'words',
];

const SUPPORTED_MODULE_ID_SET = new Set<string>(WEB_SUPPORTED_MODULE_IDS);

export function isWebSupportedModuleId(moduleId: string): moduleId is ModuleId {
  return SUPPORTED_MODULE_ID_SET.has(moduleId);
}
