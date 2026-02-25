'use server';

import { getAdapter, ensureModuleMigrations } from '@/lib/db';
import {
  getModeConfig,
  saveModeConfig,
  getStoredEntitlement,
  saveEntitlement,
} from '@/lib/entitlements';
import {
  resolveCurrentApiBaseUrl,
  testSelfHostConnection,
  type SelfHostConnectionResult,
} from '@/lib/server-endpoint';
import {
  getEnabledModules,
  enableModule,
  disableModule,
  incrementAggregateEventCounter,
  listAggregateEventCounters,
  getPreference,
  setPreference,
} from '@mylife/db';
import type { Entitlements, PlanMode } from '@mylife/entitlements';
import { isWebSupportedModuleId } from '@/lib/modules';

export type SelfHostConnectionMethod =
  | 'port_forward_tls'
  | 'dynamic_dns'
  | 'outbound_tunnel';

const SELF_HOST_CONNECTION_METHOD_KEY = 'self_host.connection_method';
const DEFAULT_SELF_HOST_CONNECTION_METHOD: SelfHostConnectionMethod = 'port_forward_tls';

/** Get all enabled module IDs from SQLite. */
export async function getEnabledModuleIds(): Promise<string[]> {
  const db = getAdapter();
  const rows = getEnabledModules(db);
  return rows.map((r) => r.module_id).filter(isWebSupportedModuleId);
}

/** Enable a module: persist to SQLite, run migrations. */
export async function enableModuleAction(moduleId: string): Promise<void> {
  if (!isWebSupportedModuleId(moduleId)) return;
  const db = getAdapter();
  enableModule(db, moduleId);
  ensureModuleMigrations(moduleId);
}

/** Disable a module: remove from SQLite. */
export async function disableModuleAction(moduleId: string): Promise<void> {
  const db = getAdapter();
  disableModule(db, moduleId);
}

/** Get currently selected runtime mode and optional custom server URL. */
export async function getModeConfigAction(): Promise<{
  mode: PlanMode;
  serverUrl: string | null;
}> {
  return getModeConfig();
}

/** Persist mode selection and optional custom server URL. */
export async function setModeConfigAction(
  mode: PlanMode,
  serverUrl?: string | null,
): Promise<void> {
  saveModeConfig(mode, serverUrl ?? null);
  incrementAggregateEventCounter(getAdapter(), `mode_selected:${mode}`);
}

/** Return cached entitlement payload if one exists. */
export async function getStoredEntitlementAction(): Promise<Entitlements | null> {
  return getStoredEntitlement();
}

/** Refresh entitlement state from configured hosted/self-host endpoint. */
export async function refreshStoredEntitlementAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  const resolved = resolveCurrentApiBaseUrl();
  if (!resolved.ok || !resolved.url) {
    return {
      ok: false,
      message: `No sync endpoint is configured for the current mode (${resolved.reason ?? 'unknown'}).`,
    };
  }

  const syncKey = process.env.MYLIFE_ENTITLEMENT_SYNC_KEY;
  let response: Response;
  try {
    response = await fetch(`${resolved.url}/api/entitlements/sync`, {
      method: 'GET',
      headers: syncKey
        ? {
            'x-entitlement-sync-key': syncKey,
          }
        : undefined,
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      message: 'Sync request failed. Check network connectivity and endpoint availability.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: `Sync failed with HTTP ${response.status}.`,
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      ok: false,
      message: 'Sync response was not valid JSON.',
    };
  }

  const token = (body as { token?: unknown })?.token;
  const entitlements = (body as { entitlements?: unknown })?.entitlements;
  if (typeof token !== 'string' || entitlements === undefined) {
    return {
      ok: false,
      message: 'Sync response is missing token or entitlements.',
    };
  }

  const saved = await saveEntitlement(token, entitlements);
  if (!saved.ok) {
    return {
      ok: false,
      message: `Entitlement save failed: ${saved.reason}.`,
    };
  }

  return {
    ok: true,
    message: 'Entitlement refreshed successfully.',
  };
}


/** Run connectivity checks for a self-host endpoint from the server runtime. */
export async function testSelfHostConnectionAction(
  serverUrl: string,
): Promise<SelfHostConnectionResult> {
  return testSelfHostConnection(serverUrl);
}

/** Record a privacy-safe operational counter (no user content, no user IDs). */
export async function recordOperationalEventAction(
  eventKey: 'setup_completed:self_host' | 'setup_completed:mode_switch',
): Promise<void> {
  incrementAggregateEventCounter(getAdapter(), eventKey);
}

/** Read preferred self-host connectivity method selection. */
export async function getSelfHostConnectionMethodAction(): Promise<SelfHostConnectionMethod> {
  const raw = getPreference(getAdapter(), SELF_HOST_CONNECTION_METHOD_KEY);
  if (
    raw === 'port_forward_tls'
    || raw === 'dynamic_dns'
    || raw === 'outbound_tunnel'
  ) {
    return raw;
  }

  return DEFAULT_SELF_HOST_CONNECTION_METHOD;
}

/** Persist preferred self-host connectivity method selection. */
export async function setSelfHostConnectionMethodAction(
  method: SelfHostConnectionMethod,
): Promise<void> {
  setPreference(getAdapter(), SELF_HOST_CONNECTION_METHOD_KEY, method);
}

/** Read aggregate operational counters for diagnostics/ops dashboards. */
export async function listOperationalCountersAction(input?: {
  prefix?: string;
  bucketDate?: string;
  limit?: number;
}) {
  return listAggregateEventCounters(getAdapter(), {
    eventKeyPrefix: input?.prefix,
    bucketDate: input?.bucketDate,
    limit: input?.limit,
  });
}
