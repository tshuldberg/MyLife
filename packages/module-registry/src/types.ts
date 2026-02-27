import { z } from 'zod';

/** All known module identifiers in the MyLife suite. */
export type ModuleId =
  | 'books'
  | 'budget'
  | 'fast'
  | 'recipes'
  | 'rsvp'
  | 'surf'
  | 'workouts'
  | 'homes'
  | 'car'
  | 'habits'
  | 'meds'
  | 'words'
  | 'subs';

/** Zod schema for runtime validation of ModuleId values. */
export const ModuleIdSchema = z.enum([
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
  'subs',
]);

/** A tab displayed in the module's bottom navigation. */
export interface ModuleTab {
  /** Unique key for the tab within this module. */
  key: string;
  /** Display label shown in the tab bar. */
  label: string;
  /** Icon name (from the icon library used by the host app). */
  icon: string;
}

/** A navigable screen within the module (not a tab). */
export interface ModuleScreen {
  /** Route name used by the navigation system. */
  name: string;
  /** Display title for the header bar. */
  title: string;
}

/** A single database migration step for a module's local schema. */
export interface Migration {
  /** Sequential version number (1-indexed). */
  version: number;
  /** Human-readable description of what this migration does. */
  description: string;
  /** SQL statements to apply this migration. */
  up: string[];
  /** SQL statements to revert this migration. */
  down: string[];
}

/** Pricing tier — determines whether the module is available without purchase. */
export type ModuleTier = 'free' | 'premium';

/** Storage backend used by the module. */
export type StorageType = 'sqlite' | 'supabase' | 'drizzle';

/**
 * Complete definition of a MyLife module.
 *
 * Every module in the suite implements this contract. The hub app uses it
 * to register, enable/disable, and render modules dynamically.
 */
export interface ModuleDefinition {
  /** Unique identifier for this module. */
  id: ModuleId;
  /** Display name (e.g. 'MyBooks'). */
  name: string;
  /** Short tagline shown on the module card (e.g. 'Track your reading life'). */
  tagline: string;
  /** Emoji icon representing the module. */
  icon: string;
  /** Brand accent color as a hex string (e.g. '#C9894D'). */
  accentColor: string;
  /** Whether this module is free or requires a premium purchase. */
  tier: ModuleTier;
  /** Which storage backend this module uses. */
  storageType: StorageType;
  /** Database migrations for modules using local SQLite storage. */
  migrations?: Migration[];
  /** Current schema version (corresponds to the latest migration version). */
  schemaVersion?: number;
  /** Table name prefix to avoid collisions in a shared database (e.g. 'bk_'). */
  tablePrefix?: string;
  /** Navigation structure: tabs for the tab bar, screens for stack navigation. */
  navigation: {
    tabs: ModuleTab[];
    screens: ModuleScreen[];
  };
  /** Whether this module requires user authentication. */
  requiresAuth: boolean;
  /** Whether this module requires a network connection to function. */
  requiresNetwork: boolean;
  /** Semantic version string for this module release. */
  version: string;
}

/** Zod schema for validating ModuleDefinition objects at runtime. */
export const ModuleDefinitionSchema: z.ZodType<ModuleDefinition> = z.object({
  id: ModuleIdSchema,
  name: z.string().min(1),
  tagline: z.string().min(1),
  icon: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  tier: z.enum(['free', 'premium']),
  storageType: z.enum(['sqlite', 'supabase', 'drizzle']),
  migrations: z
    .array(
      z.object({
        version: z.number().int().positive(),
        description: z.string(),
        up: z.array(z.string()),
        down: z.array(z.string()),
      }),
    )
    .optional(),
  schemaVersion: z.number().int().nonnegative().optional(),
  tablePrefix: z.string().optional(),
  navigation: z.object({
    tabs: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        icon: z.string(),
      }),
    ),
    screens: z.array(
      z.object({
        name: z.string(),
        title: z.string(),
      }),
    ),
  }),
  requiresAuth: z.boolean(),
  requiresNetwork: z.boolean(),
  version: z.string(),
});
