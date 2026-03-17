import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const thisDir = dirname(fileURLToPath(import.meta.url));

describe('Habits hub page wrapper', () => {
  it('renders a hub-native ModuleWebFallback for MyHabits', () => {
    const source = readFileSync(resolve(thisDir, '../page.tsx'), 'utf8');
    expect(source).toContain("import { ModuleWebFallback } from '@/components/module-web-fallback'");
    expect(source).toContain('moduleName="MyHabits"');
  });
});
