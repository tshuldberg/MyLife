import { describe, expect, it } from 'vitest';
import { MODULE_IDS } from '../constants';
import {
  GA_MODULE_IDS,
  MERGED_MODULE_IDS,
  MODULE_RELEASE_STATES,
  PUBLIC_BETA_MODULE_IDS,
  USER_VISIBLE_MODULE_IDS,
  getModuleReleaseDescription,
  getModuleReleaseLabel,
  isGeneralAvailabilityModule,
  isMergedModule,
  isPublicBetaModule,
  isUserVisibleModule,
} from '../release-states';

describe('module release states', () => {
  it('covers every registered module exactly once', () => {
    const allReleaseIds = new Set([
      ...GA_MODULE_IDS,
      ...PUBLIC_BETA_MODULE_IDS,
      ...MERGED_MODULE_IDS,
    ]);

    expect(allReleaseIds.size).toBe(MODULE_IDS.length);

    for (const moduleId of MODULE_IDS) {
      expect(allReleaseIds.has(moduleId)).toBe(true);
      expect(MODULE_RELEASE_STATES[moduleId]).toBeDefined();
    }
  });

  it('matches the agreed launch counts', () => {
    expect(GA_MODULE_IDS).toHaveLength(9);
    expect(PUBLIC_BETA_MODULE_IDS).toHaveLength(19);
    expect(MERGED_MODULE_IDS).toEqual(['subs']);
    expect(USER_VISIBLE_MODULE_IDS).toHaveLength(28);
  });

  it('returns stable release helpers for each tier', () => {
    expect(isGeneralAvailabilityModule('budget')).toBe(true);
    expect(isPublicBetaModule('workouts')).toBe(true);
    expect(isMergedModule('subs')).toBe(true);
    expect(isUserVisibleModule('subs')).toBe(false);
    expect(isUserVisibleModule('books')).toBe(true);
  });

  it('formats launch labels and descriptions', () => {
    expect(getModuleReleaseLabel('books')).toBe('GA');
    expect(getModuleReleaseLabel('workouts')).toBe('BETA');
    expect(getModuleReleaseLabel('subs')).toBe('MERGED');
    expect(getModuleReleaseDescription('books')).toContain('production launch promise');
    expect(getModuleReleaseDescription('workouts')).toContain('public beta');
    expect(getModuleReleaseDescription('subs')).toContain('Folded');
  });
});
