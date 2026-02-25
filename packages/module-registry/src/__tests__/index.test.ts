import { describe, expect, it } from 'vitest';
import {
  FREE_MODULES,
  MODULE_IDS,
  MODULE_METADATA,
  ModuleDefinitionSchema,
  ModuleIdSchema,
  ModuleRegistry,
  ModuleRegistryContext,
  useEnabledModules,
  useModule,
  useModuleRegistry,
} from '../index';
import {
  FREE_MODULES as FREE_MODULES_DIRECT,
  MODULE_IDS as MODULE_IDS_DIRECT,
  MODULE_METADATA as MODULE_METADATA_DIRECT,
} from '../constants';
import {
  ModuleRegistryContext as ModuleRegistryContextDirect,
  useEnabledModules as useEnabledModulesDirect,
  useModule as useModuleDirect,
  useModuleRegistry as useModuleRegistryDirect,
} from '../hooks';
import { ModuleRegistry as ModuleRegistryDirect } from '../registry';
import {
  ModuleDefinitionSchema as ModuleDefinitionSchemaDirect,
  ModuleIdSchema as ModuleIdSchemaDirect,
} from '../types';

describe('index barrel exports', () => {
  it('re-exports constants and runtime symbols by reference', () => {
    expect(MODULE_IDS).toBe(MODULE_IDS_DIRECT);
    expect(FREE_MODULES).toBe(FREE_MODULES_DIRECT);
    expect(MODULE_METADATA).toBe(MODULE_METADATA_DIRECT);
    expect(ModuleRegistry).toBe(ModuleRegistryDirect);
    expect(ModuleRegistryContext).toBe(ModuleRegistryContextDirect);
    expect(useModuleRegistry).toBe(useModuleRegistryDirect);
    expect(useEnabledModules).toBe(useEnabledModulesDirect);
    expect(useModule).toBe(useModuleDirect);
    expect(ModuleIdSchema).toBe(ModuleIdSchemaDirect);
    expect(ModuleDefinitionSchema).toBe(ModuleDefinitionSchemaDirect);
  });
});
