/**
 * @mylife/sync -- Core types for the data sync abstraction layer.
 *
 * Defines sync tiers, provider interface, and status types used across
 * all sync providers (local-only, P2P, cloud).
 */

/**
 * Sync tier determines the sync strategy and storage limits.
 *
 * - local_only: No sync, data stays on device (Tier 0)
 * - p2p: Device-to-device sync via WebRTC, no auth required (Tier 1)
 * - free_cloud: 1GB cloud sync via PowerSync, requires auth (Tier 2)
 * - starter_cloud: 5GB cloud sync via PowerSync, requires auth (Tier 3a)
 * - power_cloud: 25GB cloud sync via PowerSync, requires auth (Tier 3b)
 */
export type SyncTier =
  | 'local_only'
  | 'p2p'
  | 'free_cloud'
  | 'starter_cloud'
  | 'power_cloud';

/** Current status of the sync provider. */
export interface SyncStatus {
  tier: SyncTier;
  connected: boolean;
  lastSyncedAt: Date | null;
  storageUsedBytes: number;
  storageLimitBytes: number;
  pendingChanges: number;
}

/** Events emitted by a SyncProvider during its lifecycle. */
export type SyncEvent =
  | { type: 'status_change'; status: SyncStatus }
  | { type: 'sync_complete'; timestamp: Date }
  | { type: 'sync_error'; error: Error }
  | { type: 'peer_connected'; peerId: string }
  | { type: 'peer_disconnected'; peerId: string };

export type SyncEventListener = (event: SyncEvent) => void;

/**
 * Abstract interface that all sync providers must implement.
 * The hub creates one active provider at a time based on the user's tier.
 */
export interface SyncProvider {
  /** The tier this provider serves. */
  readonly tier: SyncTier;

  /** Initialize the provider. Must be called before sync(). */
  initialize(): Promise<void>;

  /** Trigger a sync cycle. No-op for local-only. */
  sync(): Promise<void>;

  /** Pause active syncing (keeps connection alive if applicable). */
  pause(): Promise<void>;

  /** Resume syncing after a pause. */
  resume(): Promise<void>;

  /** Get the current sync status snapshot. */
  getStatus(): SyncStatus;

  /** Get the number of bytes used by the local SQLite database. */
  getStorageUsed(): Promise<number>;

  /** Register a listener for sync events. Returns an unsubscribe function. */
  onEvent(listener: SyncEventListener): () => void;

  /** Tear down the provider and release resources. */
  destroy(): Promise<void>;
}

/**
 * Storage limits per cloud tier in bytes.
 * P2P and local-only have no cloud storage limit (Infinity).
 */
export const STORAGE_LIMITS: Record<SyncTier, number> = {
  local_only: Infinity,
  p2p: Infinity,
  free_cloud: 1 * 1024 * 1024 * 1024, // 1 GB
  starter_cloud: 5 * 1024 * 1024 * 1024, // 5 GB
  power_cloud: 25 * 1024 * 1024 * 1024, // 25 GB
};

/** Returns true if the given tier requires Supabase auth. */
export function tierRequiresAuth(tier: SyncTier): boolean {
  return tier === 'free_cloud' || tier === 'starter_cloud' || tier === 'power_cloud';
}

/** Returns true if the given tier is a cloud tier. */
export function isCloudTier(tier: SyncTier): boolean {
  return tierRequiresAuth(tier);
}
