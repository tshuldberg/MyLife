import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type ModuleStatus = 'implemented' | 'design_only' | 'scaffolded' | 'archived';
type ParityMode = 'passthrough' | 'adapter' | 'design_only' | 'scaffolded' | 'archived';

interface StandaloneParitySpec {
  standalone: string;
  moduleId: string;
  moduleStatus: ModuleStatus;
  webParityMode: ParityMode;
  mobileParityMode: ParityMode;
  archiveRoot?: string;
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
    moduleStatus: 'archived',
    webParityMode: 'archived',
    mobileParityMode: 'archived',
    archiveRoot: 'archive/MyBooks',
    standaloneWebRoots: ['MyBooks/apps/web/app'],
    standaloneMobileRoots: ['MyBooks/apps/mobile/app'],
  },
  {
    standalone: 'MyBudget',
    moduleId: 'budget',
    moduleStatus: 'archived',
    webParityMode: 'archived',
    mobileParityMode: 'archived',
    archiveRoot: 'archive/MyBudget',
    standaloneWebRoots: ['MyBudget/apps/web/app'],
    standaloneMobileRoots: ['MyBudget/apps/mobile/app'],
  },
  {
    // TODO: update to 'implemented' + 'passthrough' once MyCar standalone is built
    standalone: 'MyCar',
    moduleId: 'car',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyCloset',
    moduleId: 'closet',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyCycle',
    moduleId: 'cycle',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    // TODO: update to 'implemented' + 'passthrough' once MyFast standalone is built
    standalone: 'MyFast',
    moduleId: 'fast',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyFlash',
    moduleId: 'flash',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyGarden',
    moduleId: 'garden',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyHealth',
    moduleId: 'health',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
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
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MyHomes/apps/web/src/app', 'MyHomes/apps/web/app'],
    standaloneMobileRoots: ['MyHomes/apps/mobile/app'],
  },
  {
    standalone: 'MyJournal',
    moduleId: 'journal',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyMail',
    moduleId: 'mail',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
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
    moduleId: 'mood',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyNotes',
    moduleId: 'notes',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyPets',
    moduleId: 'pets',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyRecipes',
    moduleId: 'recipes',
    moduleStatus: 'archived',
    webParityMode: 'archived',
    mobileParityMode: 'archived',
    archiveRoot: 'archive/MyRecipes',
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
    moduleId: 'stars',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MySubs',
    moduleId: 'subs',
    moduleStatus: 'scaffolded',
    webParityMode: 'scaffolded',
    mobileParityMode: 'scaffolded',
  },
  {
    standalone: 'MySurf',
    moduleId: 'surf',
    moduleStatus: 'implemented',
    webParityMode: 'passthrough',
    mobileParityMode: 'adapter',
    standaloneWebRoots: ['MySurf/apps/web/app'],
    standaloneMobileRoots: ['MySurf/apps/mobile/app'],
  },
  {
    standalone: 'MyTrails',
    moduleId: 'trails',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
  },
  {
    standalone: 'MyVoice',
    moduleId: 'voice',
    moduleStatus: 'design_only',
    webParityMode: 'design_only',
    mobileParityMode: 'design_only',
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
    moduleStatus: 'archived',
    webParityMode: 'archived',
    mobileParityMode: 'archived',
    archiveRoot: 'archive/MyWorkouts',
  },
];

const habitsWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/habits/page.tsx',
    expected: "export { default } from '@myhabits-web/app/habits/page';",
    standalone: 'MyHabits/apps/web/app/habits/page.tsx',
  },
  {
    hub: 'apps/web/app/habits/stats/page.tsx',
    expected: "export { default } from '@myhabits-web/app/habits/stats/page';",
    standalone: 'MyHabits/apps/web/app/habits/stats/page.tsx',
  },
  {
    hub: 'apps/web/app/habits/cycle/page.tsx',
    expected: "export { default } from '@myhabits-web/app/habits/cycle/page';",
    standalone: 'MyHabits/apps/web/app/habits/cycle/page.tsx',
  },
  {
    hub: 'apps/web/app/habits/[id]/page.tsx',
    expected: "export { default } from '@myhabits-web/app/habits/[id]/page';",
    standalone: 'MyHabits/apps/web/app/habits/[id]/page.tsx',
  },
];

const wordsWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/words/page.tsx',
    expected: "export { default } from '@mywords-web/app/page';",
    standalone: 'MyWords/apps/web/app/page.tsx',
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

const homesWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/homes/messages/page.tsx',
    expected: "export { default } from '@myhomes-web/src/app/(app)/messages/page';",
    standalone: 'MyHomes/apps/web/src/app/(app)/messages/page.tsx',
  },
  {
    hub: 'apps/web/app/homes/page.tsx',
    expected: "export { default } from '@myhomes-web/src/app/(app)/discover/page';",
    standalone: 'MyHomes/apps/web/src/app/(app)/discover/page.tsx',
  },
  {
    hub: 'apps/web/app/homes/profile/page.tsx',
    expected: "export { default } from '@myhomes-web/src/app/(app)/profile/page';",
    standalone: 'MyHomes/apps/web/src/app/(app)/profile/page.tsx',
  },
  {
    hub: 'apps/web/app/homes/sell/page.tsx',
    expected: "export { default } from '@myhomes-web/src/app/(app)/sell/page';",
    standalone: 'MyHomes/apps/web/src/app/(app)/sell/page.tsx',
  },
];

const surfWrappers: Array<{ hub: string; expected: string; standalone: string }> = [
  {
    hub: 'apps/web/app/surf/page.tsx',
    expected: "export { default } from '@mysurf-web/app/page';",
    standalone: 'MySurf/apps/web/app/page.tsx',
  },
  {
    hub: 'apps/web/app/surf/map/page.tsx',
    expected: "export { default } from '@mysurf-web/app/map/page';",
    standalone: 'MySurf/apps/web/app/map/page.tsx',
  },
  {
    hub: 'apps/web/app/surf/favorites/page.tsx',
    expected: "export { default } from '@mysurf-web/app/favorites/page';",
    standalone: 'MySurf/apps/web/app/favorites/page.tsx',
  },
  {
    hub: 'apps/web/app/surf/sessions/page.tsx',
    expected: "export { default } from '@mysurf-web/app/sessions/page';",
    standalone: 'MySurf/apps/web/app/sessions/page.tsx',
  },
  {
    hub: 'apps/web/app/surf/account/page.tsx',
    expected: "export { default } from '@mysurf-web/app/account/page';",
    standalone: 'MySurf/apps/web/app/account/page.tsx',
  },
  {
    hub: 'apps/web/app/surf/spot/[slug]/page.tsx',
    expected: "export { default } from '@mysurf-web/app/spot/[slug]/page';",
    standalone: 'MySurf/apps/web/app/spot/[slug]/page.tsx',
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

describe('standalone parity matrix', () => {
  const gitmodulePaths = parseGitmodulePaths();
  const webPackage = readJson<PackageJsonLike>('apps/web/package.json');
  const mobilePackage = readJson<PackageJsonLike>('apps/mobile/package.json');
  const moduleDirs = readdirSync(repoPath('modules'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const hubOnlyModules = ['forums', 'market', 'nutrition'].sort();

  it('defines explicit coverage for every active standalone repo from .gitmodules', () => {
    const activeStandalones = standaloneMatrix
      .filter((spec) => spec.moduleStatus !== 'archived')
      .map((spec) => spec.standalone)
      .sort();
    expect(activeStandalones).toEqual(gitmodulePaths);
  });

  it('tracks archived standalone repos explicitly', () => {
    const archivedStandalones = standaloneMatrix
      .filter((spec) => spec.moduleStatus === 'archived')
      .map((spec) => spec.standalone)
      .sort();
    expect(archivedStandalones).toEqual(['MyBooks', 'MyBudget', 'MyRecipes', 'MyWorkouts']);
  });

  it('maps every MyLife module directory to either a standalone source or an explicit hub-only exception', () => {
    const integratedModules = standaloneMatrix.map((spec) => spec.moduleId).sort();
    expect(moduleDirs).toEqual([...integratedModules, ...hubOnlyModules].sort());
  });

  for (const spec of standaloneMatrix) {
    const moduleId = spec.moduleId;
    const moduleName = `@mylife/${moduleId}`;
    const moduleRoot = `modules/${moduleId}`;
    const hubWebRoot = `apps/web/app/${moduleId}`;
    const hubMobileRoot = `apps/mobile/app/(${moduleId})`;

    if (spec.moduleStatus === 'archived') {
      it(`${spec.standalone}: archived standalone is represented by an archive placeholder`, () => {
        expect(existsSync(repoPath(spec.standalone))).toBe(false);
        expect(spec.archiveRoot).toBeTruthy();
        expect(existsSync(repoPath(spec.archiveRoot!))).toBe(true);
      });
    } else {
      it(`${spec.standalone}: local standalone repo exists and has git metadata`, () => {
        expect(existsSync(repoPath(spec.standalone))).toBe(true);
        expect(existsSync(repoPath(`${spec.standalone}/.git`))).toBe(true);
      });
    }

    if (spec.moduleStatus === 'scaffolded') {
      it(`${moduleName}: scaffolded module exists without active host-app wiring yet`, () => {
        expect(spec.webParityMode).toBe('scaffolded');
        expect(spec.mobileParityMode).toBe('scaffolded');
        expect(existsSync(repoPath(`${moduleRoot}/package.json`))).toBe(true);
        expect(existsSync(repoPath(`${moduleRoot}/src/definition.ts`))).toBe(true);
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
      expect(['passthrough', 'adapter', 'design_only', 'archived']).toContain(spec.webParityMode);
      expect(['passthrough', 'adapter', 'design_only', 'archived']).toContain(spec.mobileParityMode);
    });

    if (spec.moduleStatus === 'design_only') {
      it(`${moduleName}: design-only standalone includes DESIGN.md`, () => {
        expect(existsSync(repoPath(`${spec.standalone}/DESIGN.md`))).toBe(true);
        expect(spec.webParityMode).toBe('design_only');
        expect(spec.mobileParityMode).toBe('design_only');
      });

      continue;
    }

    if (spec.moduleStatus === 'archived') {
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

describe('books web parity after archive', () => {
  it('books standalone remains archived while hub routes stay in MyLife', () => {
    expect(existsSync(repoPath('MyBooks'))).toBe(false);
    expect(existsSync(repoPath('archive/MyBooks'))).toBe(true);
    expect(listRouteTsx('apps/web/app/books')).not.toHaveLength(0);
  });
});

describe('budget web parity after archive', () => {
  it('budget standalone remains archived while hub routes stay in MyLife', () => {
    expect(existsSync(repoPath('MyBudget'))).toBe(false);
    expect(existsSync(repoPath('archive/MyBudget'))).toBe(true);
    expect(listRouteTsx('apps/web/app/budget')).not.toHaveLength(0);
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

describe('recipes web parity after archive', () => {
  it('recipes standalone remains archived while hub routes stay in MyLife', () => {
    expect(existsSync(repoPath('MyRecipes'))).toBe(false);
    expect(existsSync(repoPath('archive/MyRecipes'))).toBe(true);
    expect(listRouteTsx('apps/web/app/recipes')).not.toHaveLength(0);
  });
});

// MyFast standalone is design_only (submodule stub is empty).
// These passthrough enforcement tests are skipped until the standalone is built.
// TODO: remove .skip when MyFast standalone runtime exists.
describe.skip('fast web passthrough enforcement', () => {
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

describe('homes web passthrough enforcement', () => {
  it('all homes hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = homesWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/homes');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of homesWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });

  it('MyLife web host wiring supports standalone homes passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@myhomes-web/*']).toContain(
      '../../MyHomes/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@humanhomes/shared']).toContain(
      '../../MyHomes/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@humanhomes/shared/*']).toContain(
      '../../MyHomes/packages/shared/src/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@humanhomes/ui']).toContain(
      '../../MyHomes/packages/ui/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@humanhomes/ui/*']).toContain(
      '../../MyHomes/packages/ui/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@humanhomes/shared'");
    expect(nextConfig).toContain("'@humanhomes/ui'");

    const tailwindConfig = read('apps/web/tailwind.config.ts');
    expect(tailwindConfig).toContain('../../MyHomes/apps/web/src/**/*.{ts,tsx}');
  });
});

// MyCar standalone is design_only (submodule stub is empty).
// These passthrough enforcement tests are skipped until the standalone is built.
// TODO: remove .skip when MyCar standalone runtime exists.
describe.skip('car web passthrough enforcement', () => {
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

describe('workouts web parity after archive', () => {
  it('workouts standalone remains archived while hub routes stay in MyLife', () => {
    expect(existsSync(repoPath('MyWorkouts'))).toBe(false);
    expect(existsSync(repoPath('archive/MyWorkouts'))).toBe(true);
    expect(listRouteTsx('apps/web/app/workouts')).not.toHaveLength(0);
  });
});

describe('surf web passthrough enforcement', () => {
  it('all surf hub web routes are thin passthrough wrappers to standalone pages', () => {
    const expectedFiles = surfWrappers.map((wrapper) => wrapper.hub).sort();
    const actualFiles = listRouteTsx('apps/web/app/surf');

    expect(actualFiles).toEqual(expectedFiles);

    for (const wrapper of surfWrappers) {
      expect(existsSync(repoPath(wrapper.standalone))).toBe(true);
      expect(read(wrapper.hub).trim()).toBe(wrapper.expected);
    }
  });

  it('MyLife web host wiring supports standalone surf passthrough', () => {
    const tsconfig = readJson<TsConfigLike>('apps/web/tsconfig.json');
    expect(tsconfig.compilerOptions?.paths?.['@mysurf-web/*']).toContain(
      '../../MySurf/apps/web/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mysurf/shared']).toContain(
      '../../MySurf/packages/shared/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mysurf/shared/*']).toContain(
      '../../MySurf/packages/shared/src/*',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mysurf/ui']).toContain(
      '../../MySurf/packages/ui/src/index.ts',
    );
    expect(tsconfig.compilerOptions?.paths?.['@mysurf/ui/*']).toContain(
      '../../MySurf/packages/ui/src/*',
    );

    const nextConfig = read('apps/web/next.config.ts');
    expect(nextConfig).toContain('externalDir: true');
    expect(nextConfig).toContain("'@mysurf/shared'");
    expect(nextConfig).toContain("'@mysurf/ui'");

    const tailwindConfig = read('apps/web/tailwind.config.ts');
    expect(tailwindConfig).toContain('../../MySurf/apps/web/app/**/*.{ts,tsx}');
    expect(tailwindConfig).toContain('../../MySurf/apps/web/components/**/*.{ts,tsx}');
  });
});
