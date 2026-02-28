#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());

function fail(message) {
  console.error(`FAIL ${message}`);
  failures += 1;
}

function ok(message) {
  console.log(`OK   ${message}`);
}

function ensureFile(path) {
  const full = resolve(root, path);
  if (!existsSync(full)) {
    fail(`${path} is missing`);
    return '';
  }
  ok(`${path}`);
  return readFileSync(full, 'utf8');
}

function resolveHubDirectReuseSource(hubSource) {
  const match = hubSource.match(/from ['"]@myworkouts-web\/([^'"]+)['"]/);
  if (!match) return null;

  let target = match[1];
  if (!target.endsWith('.ts') && !target.endsWith('.tsx')) {
    target = `${target}.tsx`;
  }
  return `MyWorkouts/apps/web/${target}`;
}

let failures = 0;

const standaloneFiles = [
  'MyWorkouts/docs/content/exercise-seed-data.json',
  'MyWorkouts/apps/mobile/app/(tabs)/explore.tsx',
  'MyWorkouts/apps/mobile/app/(tabs)/progress.tsx',
  'MyWorkouts/apps/mobile/app/workouts/builder.tsx',
  'MyWorkouts/apps/mobile/app/exercise/[id].tsx',
  'MyWorkouts/apps/web/app/page.tsx',
  'MyWorkouts/apps/web/app/explore/page.tsx',
  'MyWorkouts/apps/web/app/explore/body-map-web.tsx',
  'MyWorkouts/apps/web/app/exercise/[id]/page.tsx',
  'MyWorkouts/apps/web/app/workouts/page.tsx',
  'MyWorkouts/apps/web/app/workouts/builder/page.tsx',
  'MyWorkouts/apps/web/app/workout/[id]/page.tsx',
  'MyWorkouts/apps/web/app/plans/page.tsx',
  'MyWorkouts/apps/web/app/plans/[id]/page.tsx',
  'MyWorkouts/apps/web/app/plans/builder/page.tsx',
  'MyWorkouts/apps/web/app/recordings/page.tsx',
  'MyWorkouts/apps/web/app/recordings/[id]/page.tsx',
  'MyWorkouts/apps/web/app/progress/page.tsx',
  'MyWorkouts/apps/web/app/profile/page.tsx',
  'MyWorkouts/apps/web/app/pricing/page.tsx',
];

const hubFiles = [
  'modules/workouts/src/data/exercise-seed.json',
  'modules/workouts/src/db/crud.ts',
  'modules/workouts/src/db/schema.ts',
  'apps/mobile/app/(workouts)/explore.tsx',
  'apps/mobile/app/(workouts)/builder.tsx',
  'apps/mobile/app/(workouts)/exercise/[id].tsx',
  'apps/mobile/app/(workouts)/progress.tsx',
  'apps/mobile/app/(workouts)/recordings.tsx',
  'apps/mobile/app/(workouts)/workouts.tsx',
  'apps/web/app/workouts/page.tsx',
  'apps/web/app/workouts/explore/page.tsx',
  'apps/web/app/workouts/exercise/[id]/page.tsx',
  'apps/web/app/workouts/workouts/page.tsx',
  'apps/web/app/workouts/workouts/builder/page.tsx',
  'apps/web/app/workouts/workout/[id]/page.tsx',
  'apps/web/app/workouts/plans/page.tsx',
  'apps/web/app/workouts/plans/[id]/page.tsx',
  'apps/web/app/workouts/plans/builder/page.tsx',
  'apps/web/app/workouts/recordings/page.tsx',
  'apps/web/app/workouts/recordings/[id]/page.tsx',
  'apps/web/app/workouts/progress/page.tsx',
  'apps/web/app/workouts/profile/page.tsx',
  'apps/web/app/workouts/pricing/page.tsx',
];

console.log('Checking standalone MyWorkouts source artifacts...\n');
for (const path of standaloneFiles) {
  ensureFile(path);
}

console.log('\nChecking MyLife workouts parity surfaces...\n');
for (const path of hubFiles) {
  ensureFile(path);
}

const standaloneSeedRaw = ensureFile('MyWorkouts/docs/content/exercise-seed-data.json');
const hubSeedRaw = ensureFile('modules/workouts/src/data/exercise-seed.json');

try {
  const standaloneSeed = JSON.parse(standaloneSeedRaw);
  const hubSeed = JSON.parse(hubSeedRaw);

  if (!Array.isArray(standaloneSeed) || !Array.isArray(hubSeed)) {
    fail('seed data must be arrays in both standalone and hub');
  } else if (standaloneSeed.length !== hubSeed.length) {
    fail(`seed data count mismatch: standalone=${standaloneSeed.length}, hub=${hubSeed.length}`);
  } else {
    ok(`seed data count matched (${hubSeed.length})`);
  }
} catch (error) {
  fail(`seed data parsing error: ${String(error)}`);
}

const crudSource = ensureFile('modules/workouts/src/db/crud.ts');
const requiredCrudSymbols = [
  'seedWorkoutExerciseLibrary',
  'getWorkoutExercises',
  'getWorkoutExerciseById',
  'createWorkout',
  'updateWorkout',
  'getWorkouts',
  'createWorkoutSession',
  'createWorkoutFormRecording',
];

for (const symbol of requiredCrudSymbols) {
  if (!crudSource.includes(`function ${symbol}`) && !crudSource.includes(`export function ${symbol}`)) {
    fail(`modules/workouts CRUD is missing ${symbol}`);
  } else {
    ok(`modules/workouts CRUD includes ${symbol}`);
  }
}

const schemaSource = ensureFile('modules/workouts/src/db/schema.ts');
for (const tableName of [
  'wk_exercises',
  'wk_workouts',
  'wk_workout_sessions',
  'wk_form_recordings',
]) {
  if (!schemaSource.includes(tableName)) {
    fail(`schema missing table ${tableName}`);
  } else {
    ok(`schema includes ${tableName}`);
  }
}

const uiPairs = [
  {
    name: 'web dashboard',
    standalone: 'MyWorkouts/apps/web/app/page.tsx',
    hub: 'apps/web/app/workouts/page.tsx',
    sharedTokens: ['Workouts'],
  },
  {
    name: 'web explore',
    standalone: 'MyWorkouts/apps/web/app/explore/page.tsx',
    hub: 'apps/web/app/workouts/explore/page.tsx',
    sharedTokens: ['Explore', 'Search exercises'],
  },
  {
    name: 'web workouts list',
    standalone: 'MyWorkouts/apps/web/app/workouts/page.tsx',
    hub: 'apps/web/app/workouts/workouts/page.tsx',
    sharedTokens: ['Workouts'],
  },
  {
    name: 'web workout builder',
    standalone: 'MyWorkouts/apps/web/app/workouts/builder/page.tsx',
    hub: 'apps/web/app/workouts/workouts/builder/page.tsx',
    sharedTokens: ['Edit Workout', 'Update Workout', 'Description'],
  },
  {
    name: 'web progress',
    standalone: 'MyWorkouts/apps/web/app/progress/page.tsx',
    hub: 'apps/web/app/workouts/progress/page.tsx',
    sharedTokens: ['Progress'],
  },
  {
    name: 'web recordings',
    standalone: 'MyWorkouts/apps/web/app/recordings/page.tsx',
    hub: 'apps/web/app/workouts/recordings/page.tsx',
    sharedTokens: ['Form Recordings', 'Delete'],
  },
  {
    name: 'web recording detail',
    standalone: 'MyWorkouts/apps/web/app/recordings/[id]/page.tsx',
    hub: 'apps/web/app/workouts/recordings/[id]/page.tsx',
    sharedTokens: ['Coach Feedback'],
  },
  {
    name: 'web workout player',
    standalone: 'MyWorkouts/apps/web/app/workout/[id]/page.tsx',
    hub: 'apps/web/app/workouts/workout/[id]/page.tsx',
    sharedTokens: ['Workout Complete!', 'Back to Workouts'],
  },
  {
    name: 'web exercise detail',
    standalone: 'MyWorkouts/apps/web/app/exercise/[id]/page.tsx',
    hub: 'apps/web/app/workouts/exercise/[id]/page.tsx',
    sharedTokens: ['Description', 'Primary'],
  },
];

// Hub-native pages use CSS variables directly (adapter mode, not passthrough).
// No forbidden style tokens -- hub pages own their own styling.
const forbiddenHubStyleTokens = [];

console.log('\nChecking web UI parity signals...\n');
for (const pair of uiPairs) {
  const standaloneSource = ensureFile(pair.standalone);
  const hubSourceRaw = ensureFile(pair.hub);
  const directReuseTarget = resolveHubDirectReuseSource(hubSourceRaw);
  const hubSource = directReuseTarget ? ensureFile(directReuseTarget) : hubSourceRaw;

  if (directReuseTarget) {
    if (directReuseTarget !== pair.standalone) {
      fail(`${pair.name}: hub wrapper points to ${directReuseTarget} but expected ${pair.standalone}`);
    } else {
      ok(`${pair.name}: hub directly reuses standalone source`);
    }
  }

  for (const token of pair.sharedTokens) {
    if (!standaloneSource.includes(token)) {
      fail(`${pair.name}: standalone missing token "${token}"`);
    } else {
      ok(`${pair.name}: standalone token "${token}"`);
    }

    if (!hubSource.includes(token)) {
      fail(`${pair.name}: hub missing token "${token}"`);
    } else {
      ok(`${pair.name}: hub token "${token}"`);
    }
  }

  for (const forbidden of forbiddenHubStyleTokens) {
    if (hubSource.includes(forbidden)) {
      fail(`${pair.name}: hub still uses dark shell token "${forbidden}"`);
    }
  }
}

if (failures > 0) {
  console.error(`\ncheck-workouts-parity: ${failures} failure(s)`);
  process.exit(1);
}

console.log('\ncheck-workouts-parity: passed');
