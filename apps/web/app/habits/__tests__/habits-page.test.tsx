import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const thisDir = dirname(fileURLToPath(import.meta.url));

describe('Habits hub page wrapper', () => {
  it('is a thin passthrough re-export to standalone MyHabits web page', () => {
    const source = readFileSync(resolve(thisDir, '../page.tsx'), 'utf8').trim();
    expect(source).toBe("export { default } from '@myhabits-web/app/habits/page';");
  });
});
