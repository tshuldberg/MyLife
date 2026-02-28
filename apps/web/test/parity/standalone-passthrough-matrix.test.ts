import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type ModuleStatus = 'implemented' | 'design_only' | 'standalone_only';
type ParityMode = 'passthrough' | 'adapter' | 'design_only' | 'standalone_only';

interface StandaloneParitySpec {
  standalone: string;
  moduleId: string | null;
  moduleStatus: ModuleStatus;
  webParityMode: ParityMode;
  mobileParityMode: ParityMode;
  standaloneWebRoots?: string[];
  standaloneMobileRoots?: string[];
}

interface PackageJsonLike {
  dependencies?: Record<string, string>;
}

interface TsConfigLike {
  compilerOptions?: { paths?: Record<string, string[]> };
}

const thisDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(thisDir, '..', '..', '..', '..');

const standaloneMatrix: StandaloneParitySpec[] = [
  {
    standalone: 'MyBooks',
    moduleId: 'books',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyBooks/apps/web/app'],
    standaloneMobileRoots: ['MyBooks/apps/mobile/app'],
  },
  {
    standalone: 'MyBudget',
    moduleId: 'budget',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyBudget/apps/web/app'],
    standaloneMobileRoots: ['MyBudget/apps/mobile/app'],
  },
  {
    standalone: 'MyCar',
    moduleId: 'car',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyCar/apps/web/app'],
    standaloneMobileRoots: ['MyCar/apps/mobile/app'],
  },
  {
    standalone: 'MyCloset',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyCycle',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyFast',
    moduleId: 'fast',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyFast/apps/web/app'],
    standaloneMobileRoots: ['MyFast/apps/mobile/app'],
  },
  {
    standalone: 'MyFlash',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyGarden',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyHabits',
    moduleId: 'habits',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyHabits/apps/web/app'],
    standaloneMobileRoots: ['MyHabits/apps/mobile/app'],
  },
  {
    standalone: 'MyHomes',
    moduleId: 'homes',
    moduleStatus: 'implemented',
    webParityMode: 'adapter',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyHomes/apps/web/src/app', 'MyHomes/apps/web/app'],
    standaloneMobileRoots: ['MyHomes/apps/mobile/app'],
  },
  {
    standalone: 'MyJournal',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyMeds',
    moduleId: 'meds',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyMood',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyNotes',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyPets',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyRecipes',
    moduleId: 'recipes',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyRecipes/apps/web/app'],
    standaloneMobileRoots: ['MyRecipes/apps/mobile/app'],
  },
  {
    standalone: 'MyRSVP',
    moduleId: 'rsvp',
    moduleStatus: 'implemented',
    webParityMode: 'adapter',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyRSVP/apps/web/app'],
    standaloneMobileRoots: ['MyRSVP/apps/mobile/app'],
  },
  {
    standalone: 'MyStars',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MySubs',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MySurf',
    moduleId: 'surf',
    moduleStatus: 'implemented',
    webParityMode: 'adapter',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MySurf/apps/web/app'],
    standaloneMobileRoots: ['MySurf/apps/mobile/app'],
  },
  {
    standalone: 'MyTrails',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyVoice',
    moduleId: null,
    moduleStatus: 'standalone_only',
    webParityMode: 'standalone_only',
    mobileParityMode: 'standalone_only',
  },
  {
    standalone: 'MyWords',
    moduleId: 'words',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyWords/apps/web/app'],
    standaloneMobileRoots: ['MyWords/apps/mobile/app'],
  },
  {
    standalone: 'MyWorkouts',
    moduleId: 'workouts',
    moduleStatus: 'implemented',
    webParityMode: 'adapter',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyWorkouts/apps/web/app'],
    standaloneMobileRoots: ['MyWorkouts/apps/mobile/app'],
  },
];

const habitsWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/habits/page.tsx',
    expected: "export { default } from '@myhabits-web/app/habits/page';",
    standalone: 'MyHabits/apps/web/app/habits/page.tsx',
  },
];

const booksWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/books/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/page';",
    standalone: 'MyBooks/apps/web/app/books/page.tsx',
  },
  {
    hub: 'apps/web/app/books/search/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/search/page';",
    standalone: 'MyBooks/apps/web/app/books/search/page.tsx',
  },
  {
    hub: 'apps/web/app/books/import/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/import/page';",
    standalone: 'MyBooks/apps/web/app/books/import/page.tsx',
  },
  {
    hub: 'apps/web/app/books/stats/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/stats/page';",
    standalone: 'MyBooks/apps/web/app/books/stats/page.tsx',
  },
  {
    hub: 'apps/web/app/books/reader/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/reader/page';",
    standalone: 'MyBooks/apps/web/app/books/reader/page.tsx',
  },
  {
    hub: 'apps/web/app/books/reader/[id]/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/reader/[id]/page';",
    standalone: 'MyBooks/apps/web/app/books/reader/[id]/page.tsx',
  },
  {
    hub: 'apps/web/app/books/[id]/page.tsx',
    expected: "export { default } from '@mybooks-web/app/books/[id]/page';",
    standalone: 'MyBooks/apps/web/app/books/[id]/page.tsx',
  },
];

const budgetWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/budget/page.tsx',
    expected: "export { default } from '@mybudget-web/app/page';",
    standalone: 'MyBudget/apps/web/app/page.tsx',
  },
];

const wordsWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/words/page.tsx',
    expected: "export { default } from '@mywords-web/app/page';",
    standalone: 'MyWords/apps/web/app/page.tsx',
  },
];

const recipesWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/recipes/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/page';",
    standalone: 'MyRecipes/apps/web/app/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/library/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/recipes/page';",
    standalone: 'MyRecipes/apps/web/app/recipes/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/library/[id]/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/recipes/[id]/page';",
    standalone: 'MyRecipes/apps/web/app/recipes/[id]/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/add/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/add/page';",
    standalone: 'MyRecipes/apps/web/app/add/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/import/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/import/page';",
    standalone: 'MyRecipes/apps/web/app/import/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/import/review/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/import/review/page';",
    standalone: 'MyRecipes/apps/web/app/import/review/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/grocery/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/grocery/page';",
    standalone: 'MyRecipes/apps/web/app/grocery/page.tsx',
  },
  {
    hub: 'apps/web/app/recipes/pantry/page.tsx',
    expected: "export { default } from '@myrecipes-web/app/pantry/page';",
    standalone: 'MyRecipes/apps/web/app/pantry/page.tsx',
  },
];

const fastWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/fast/page.tsx',
    expected: "export { default } from '@myfast-web/app/page';",
    standalone: 'MyFast/apps/web/app/page.tsx',
  },
  {
    hub: 'apps/web/app/fast/history/page.tsx',
    expected: "export { default } from '@myfast-web/app/history/page';",
    standalone: 'MyFast/apps/web/app/history/page.tsx',
  },
  {
    hub: 'apps/web/app/fast/settings/page.tsx',
    expected: "export { default } from '@myfast-web/app/settings/page';",
    standalone: 'MyFast/apps/web/app/settings/page.tsx',
  },
  {
    hub: 'apps/web/app/fast/stats/page.tsx',
    expected: "export { default } from '@myfast-web/app/stats/page';",
    standalone: 'MyFast/apps/web/app/stats/page.tsx',
  },
];

const carWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/car/page.tsx',
    expected: "export { default } from '@mycar-web/app/page';",
    standalone: 'MyCar/apps/web/app/page.tsx',
  },
  {
    hub: 'apps/web/app/car/expenses/page.tsx',
    expected: "export { default } from '@mycar-web/app/expenses/page';",
    standalone: 'MyCar/apps/web/app/expenses/page.tsx',
  },
  {
    hub: 'apps/web/app/car/garage/page.tsx',
    expected: "export { default } from '@mycar-web/app/garage/page';",
    standalone: 'MyCar/apps/web/app/garage/page.tsx',
  },
  {
    hub: 'apps/web/app/car/garage/[id]/page.tsx',
    expected: "export { default } from '@mycar-web/app/garage/[id]/page';",
    standalone: 'MyCar/apps/web/app/garage/[id]/page.tsx',
  },
  {
    hub: 'apps/web/app/car/reminders/page.tsx',
    expected: "export { default } from '@mycar-web/app/reminders/page';",
    standalone: 'MyCar/apps/web/app/reminders/page.tsx',
  },
  {
    hub: 'apps/web/app/car/settings/page.tsx',
    expected: "export { default } from '@mycar-web/app/settings/page';",
    standalone: 'MyCar/apps/web/app/settings/page.tsx',
  },
];

function repoPath(path: string): string {
  return resolve(repoRoot, path);
}

function read(path: string): string {
  return readFileSync(repoPath(path), 'utf8');
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function parseGitmodulePaths(): string[] {
  return read('.gitmodules')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('path = '))
    .map((line) => line.slice('path = '.length).trim())
    .sort();
}

function listRouteTsx(dirPath: string): string[] {
  const root = repoPath(dirPath);
  if (!existsSync(root)) return [];

  const out: string[] = [];

  function walk(current: string): void {
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        if (
          ['node_modules', '.next', '.turbo', '.expo', 'dist', '__tests__'].includes(
            entry.name,
          )
        ) {
          continue;
        }
        walk(next);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.tsx')) continue;
      if (entry.name.endsWith('.test.tsx')) continue;
      if (entry.name === '_layout.tsx' || entry.name === 'layout.tsx' || entry.name === '+not-found.tsx') {
        continue;
      }

      out.push(relative(repoRoot, next).replace(/\\/g, '/'));
    }
  }

  walk(root);
  return out.sort();
}

function inferModuleId(standalone: string): string {
  return standalone.replace(/^My/, '').toLowerCase();
}

describe('standalone parity matrix', () => {
  const gitmodulePaths = parseGitmodulePaths();
  const webPackage = readJson<PackageJsonLike>('apps/web/package.json');
  const mobilePackage = readJson<PackageJsonLike>('apps/mobile/package.json');
  const moduleDirs = readdirSync(repoPath('modules'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  it('defines explicit coverage for every standalone repo from .gitmodules', () => {
    expect(standaloneMatrix.map((spec) => spec.standalone).sort()).toEqual(gitmodulePaths);
  });

  it('maps every MyLife module directory to exactly one standalone source', () => {
    const integratedModules = standaloneMatrix
      .map((spec) => spec.moduleId)
      .filter((id): id is string => id !== null)
      .sort();
    expect(integratedModules).toEqual(moduleDirs);
  });

  for (const spec of standaloneMatrix) {
    const inferredModule = inferModuleId(spec.standalone);
    const moduleId = spec.moduleId ?? inferredModule;
    const moduleName = `@mylife/${moduleId}`;
    const moduleRoot = `modules/${moduleId}`;
    const hubWebRoot = `apps/web/app/${moduleId}`;
    const hubMobileRoot = `apps/mobile/app/(${moduleId})`;

    it(`${spec.standalone}: local standalone repo exists and has git metadata`, () => {
      expect(existsSync(repoPath(spec.standalone))).toBe(true);
      expect(existsSync(repoPath(`${spec.standalone}/.git`))).toBe(true);
    });

    if (spec.moduleId === null) {
      it(`${spec.standalone}: explicitly marked standalone-only (no MyLife module wiring yet)`, () => {
        expect(spec.moduleStatus).toBe('standalone_only');
        expect(spec.webParityMode).toBe('standalone_only');
        expect(spec.mobileParityMode).toBe('standalone_only');
        expect(existsSync(repoPath(moduleRoot))).toBe(false);
        expect(existsSync(repoPath(hubWebRoot))).toBe(false);
        expect(existsSync(repoPath(hubMobileRoot))).toBe(false);
        expect(webPackage.dependencies?.[moduleName]).toBeUndefined();
        expect(mobilePackage.dependencies?.[moduleName]).toBeUndefined();
      });

      continue;
    }

    it(`${moduleName}: module package, definition, hub routes, and package deps are wired`, () => {
      expect(existsSync(repoPath(`${moduleRoot}/package.json`))).toBe(true);
      expect(existsSync(repoPath(`${moduleRoot}/src/definition.ts`))).toBe(true);
      expect(existsSync(repoPath(hubWebRoot))).toBe(true);
      expect(existsSync(repoPath(hubMobileRoot))).toBe(true);
      expect(webPackage.dependencies?.[moduleName]).toBeTruthy();
      expect(mobilePackage.dependencies?.[moduleName]).toBeTruthy();
    });

    it(`${moduleName}: parity mode is explicit for web and mobile`, () => {
      expect(['passthrough', 'adapter', 'design_only']).toContain(spec.webParityMode);
      expect(['passthrough', 'adapter', 'design_only']).toContain(spec.mobileParityMode);
    });

    if (spec.moduleStatus === 'design_only') {
      it(`${moduleName}: design-only standalone includes DESIGN.md`, () => {
        expect(existsSync(repoPath(`${spec.standalone}/DESIGN.md`))).toBe(true);
        expect(spec.webParityMode).toBe('design_only');
        expect(spec.mobileParityMode).toBe('design_only');
      });

      continue;
    }

    it(`${moduleName}: implemented standalone and hub route roots both contain runtime screens`, () => {
      const standaloneWebRoot = spec.standaloneWebRoots?.find((path) => existsSync(repoPath(path)));
      const standaloneMobileRoot = spec.standaloneMobileRoots?.find((path) =>
        existsSync(repoPath(path)),
      );

      expect(standaloneWebRoot).toBeTruthy();
      expect(standaloneMobileRoot).toBeTruthy();
      expect(listRouteTsx(standaloneWebRoot!)).not.toHaveLength(0);
      expect(listRouteTsx(standaloneMobileRoot!)).not.toHaveLength(0);
      expect(listRouteTsx(hubWebRoot)).not.toHaveLength(0);
      expect(listRouteTsx(hubMobileRoot)).not.toHaveLength(0);
    });
  }
});

describe('books web passthrough enforcement', () => {
  it('all books hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = booksWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/books');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of booksWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }

    expect(existsSync(repoPath('MyBooks/apps/web/app/books/layout.tsx'))).toBe(true);
    expect(read('apps/web/app/books/layout.tsx').trim()).toBe(
      "export { default } from '@mybooks-web/app/books/layout';",
    );
  });

  it('MyLife web host wiring supports standalone books passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@mybooks-web/*']).toContain(
      '../../MyBooks/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mybooks/shared']).toContain(
      '../../MyBooks/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mybooks/shared/*']).toContain(
      '../../MyBooks/packages/shared/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@mybooks/shared'");
    expect(nextConfig).toContain("'@mybooks/ui'");
  });
});

describe('budget web passthrough enforcement', () => {
  it('all budget hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = budgetWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/budget');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of budgetWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });

  it('MyLife web host wiring supports standalone budget passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@mybudget-web/*']).toContain(
      '../../MyBudget/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mybudget/shared']).toContain(
      '../../MyBudget/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mybudget/shared/*']).toContain(
      '../../MyBudget/packages/shared/src/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mybudget/ui']).toContain(
      '../../MyBudget/packages/ui/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mybudget/ui/*']).toContain(
      '../../MyBudget/packages/ui/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@mybudget/shared'");
    expect(nextConfig).toContain("'@mybudget/ui'");
  });
});

describe('words web passthrough enforcement', () => {
  it('all words hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = wordsWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/words');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of wordsWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }

  });

  it('MyLife web host wiring supports standalone words passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@mywords-web/*']).toContain(
      '../../MyWords/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mywords/shared']).toContain(
      '../../MyWords/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mywords/shared/*']).toContain(
      '../../MyWords/packages/shared/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
  });
});

describe('habits web passthrough enforcement', () => {
  it('all habits hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = habitsWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/habits');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of habitsWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });
});

describe('recipes web passthrough enforcement', () => {
  it('all recipes hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = recipesWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/recipes');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of recipesWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });

  it('MyLife web host wiring supports standalone recipes passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@myrecipes-web/*']).toContain(
      '../../MyRecipes/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myrecipes/shared']).toContain(
      '../../MyRecipes/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myrecipes/shared/*']).toContain(
      '../../MyRecipes/packages/shared/src/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myrecipes/ui']).toContain(
      '../../MyRecipes/packages/ui/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myrecipes/ui/*']).toContain(
      '../../MyRecipes/packages/ui/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@myrecipes/shared'");
    expect(nextConfig).toContain("'@myrecipes/ui'");
  });
});

describe('fast web passthrough enforcement', () => {
  it('all fast hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = fastWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/fast');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of fastWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });

  it('MyLife web host wiring supports standalone fast passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@myfast-web/*']).toContain(
      '../../MyFast/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myfast/shared']).toContain(
      '../../MyFast/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myfast/shared/*']).toContain(
      '../../MyFast/packages/shared/src/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myfast/ui']).toContain(
      '../../MyFast/packages/ui/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@myfast/ui/*']).toContain(
      '../../MyFast/packages/ui/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@myfast/shared'");
    expect(nextConfig).toContain("'@myfast/ui'");
  });
});

describe('car web passthrough enforcement', () => {
  it('all car hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = carWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/car');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of carWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });

  it('MyLife web host wiring supports standalone car passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@mycar-web/*']).toContain(
      '../../MyCar/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mycar/shared']).toContain(
      '../../MyCar/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mycar/shared/*']).toContain(
      '../../MyCar/packages/shared/src/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mycar/ui']).toContain(
      '../../MyCar/packages/ui/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mycar/ui/*']).toContain(
      '../../MyCar/packages/ui/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@mycar/shared'");
    expect(nextConfig).toContain("'@mycar/ui'");
  });
});
