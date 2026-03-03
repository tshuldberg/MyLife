import { describe, it, expect } from 'vitest';
import { ModuleDefinitionSchema } from '@mylife/module-registry';
import { HEALTH_MODULE } from '../definition';

describe('HEALTH_MODULE definition', () => {
  it('passes Zod validation', () => {
    const result = ModuleDefinitionSchema.safeParse(HEALTH_MODULE);
    expect(result.success).toBe(true);
  });

  it('has correct id and prefix', () => {
    expect(HEALTH_MODULE.id).toBe('health');
    expect(HEALTH_MODULE.tablePrefix).toBe('hl_');
  });

  it('has 5 navigation tabs', () => {
    expect(HEALTH_MODULE.navigation.tabs).toHaveLength(5);
    const tabKeys = HEALTH_MODULE.navigation.tabs.map((t) => t.key);
    expect(tabKeys).toEqual(['today', 'fasting', 'vitals', 'insights', 'vault']);
  });

  it('has 21 navigation screens', () => {
    expect(HEALTH_MODULE.navigation.screens).toHaveLength(21);
  });

  it('marks fasting as a free section', () => {
    expect(HEALTH_MODULE.freeSections).toEqual(['fasting']);
  });

  it('uses emerald accent color', () => {
    expect(HEALTH_MODULE.accentColor).toBe('#10B981');
  });
});
