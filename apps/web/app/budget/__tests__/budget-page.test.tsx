import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..', '..', '..', '..');

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('budget web passthrough route', () => {
  it('uses a thin wrapper in MyLife', () => {
    expect(read('apps/web/app/budget/page.tsx').trim()).toBe(
      "export { default } from '@mybudget-web/app/page';",
    );
  });

  it('targets an existing standalone MyBudget page', () => {
    const standalonePath = resolve(repoRoot, 'MyBudget/apps/web/app/page.tsx');

    expect(existsSync(standalonePath)).toBe(true);
    expect(read('MyBudget/apps/web/app/page.tsx')).toContain('BudgetPage');
  });
});
