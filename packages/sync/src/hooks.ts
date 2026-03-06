/**
 * React hooks for consuming sync state.
 *
 * These hooks use React.useSyncExternalStore to subscribe to
 * SyncProvider events without re-creating subscriptions on every render.
 */

import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { SyncProvider, SyncStatus, SyncTier } from './types';

// Module-level singleton provider reference.
// Set via setSyncProvider() during app initialization.
let _activeProvider: SyncProvider | null = null;
let _providerVersion = 0;
const _providerListeners = new Set<() => void>();

function notifyProviderListeners(): void {
  _providerVersion++;
  for (const listener of _providerListeners) {
    listener();
  }
}

/**
 * Set the active sync provider. Called during app initialization
 * or when switching tiers.
 */
export function setSyncProvider(provider: SyncProvider | null): void {
  _activeProvider = provider;
  notifyProviderListeners();
}

/**
 * Get the active sync provider (for non-React code).
 */
export function getSyncProvider(): SyncProvider | null {
  return _activeProvider;
}

/**
 * Hook to access the current SyncProvider instance.
 * Re-renders when the provider is swapped (tier change).
 */
export function useSyncProvider(): SyncProvider | null {
  const subscribe = useCallback((onStoreChange: () => void) => {
    _providerListeners.add(onStoreChange);
    return () => { _providerListeners.delete(onStoreChange); };
  }, []);

  const getSnapshot = useCallback(() => _activeProvider, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const DEFAULT_STATUS: SyncStatus = {
  tier: 'local_only',
  connected: false,
  lastSyncedAt: null,
  storageUsedBytes: 0,
  storageLimitBytes: Infinity,
  pendingChanges: 0,
};

/**
 * Hook to get the current SyncStatus. Subscribes to provider events
 * and re-renders on status changes.
 */
export function useSyncStatus(): SyncStatus {
  const statusRef = useRef<SyncStatus>(DEFAULT_STATUS);

  const subscribe = useCallback((onStoreChange: () => void) => {
    // Listen for provider swaps
    _providerListeners.add(onStoreChange);

    // Listen for status events from the current provider
    let unsubEvent: (() => void) | null = null;
    if (_activeProvider) {
      statusRef.current = _activeProvider.getStatus();
      unsubEvent = _activeProvider.onEvent((event) => {
        if (event.type === 'status_change') {
          statusRef.current = event.status;
          onStoreChange();
        }
      });
    } else {
      statusRef.current = DEFAULT_STATUS;
    }

    return () => {
      _providerListeners.delete(onStoreChange);
      unsubEvent?.();
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (_activeProvider) {
      statusRef.current = _activeProvider.getStatus();
    }
    return statusRef.current;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Callback type for tier change handler. */
export type SetSyncTierFn = (tier: SyncTier) => Promise<void>;

/**
 * Hook to get a function for changing the sync tier.
 * The actual tier switching logic must be provided via setTierChangeHandler().
 */
let _tierChangeHandler: SetSyncTierFn | null = null;

export function setTierChangeHandler(handler: SetSyncTierFn): void {
  _tierChangeHandler = handler;
}

export function useSetSyncTier(): SetSyncTierFn {
  return useCallback(async (tier: SyncTier) => {
    if (!_tierChangeHandler) {
      throw new Error(
        'No tier change handler configured. Call setTierChangeHandler() during app initialization.',
      );
    }
    await _tierChangeHandler(tier);
  }, []);
}
