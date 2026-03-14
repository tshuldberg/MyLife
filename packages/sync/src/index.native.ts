/**
 * @mylife/sync -- React Native entry point.
 *
 * Re-exports only the mobile-safe subset of the sync package.
 * Node-only modules (blob filesystem storage, torrent with crypto,
 * LAN discovery) are excluded.
 */

// Core types
export type {
  SyncTier,
  SyncStatus,
  SyncEvent,
  SyncEventListener,
  SyncProvider,
  DeviceIdentity,
  PairedDevice,
  ChangeRecord,
  PeerModuleState,
  DeviceRevocation,
  BlobRef,
  BlobSyncPolicy,
  BlobPolicyEntry,
  SyncSession,
  SyncTransport,
  SyncDirection,
  SyncSessionStatus,
  SyncMessageType,
  SyncMessage,
  ContentAccess,
  ContentCategory,
  ContentManifest,
  SeedingPolicy,
  TorrentDownloadStatus,
  TorrentPieceStatus,
  TorrentPaymentDirection,
  TorrentPaymentStatus,
  TransportConnection,
  DiscoveredPeer,
  SyncEngineState,
  SyncEngineStatus,
} from './types';
export {
  STORAGE_LIMITS,
  tierRequiresAuth,
  isCloudTier,
  DeviceIdentitySchema,
  PairedDeviceSchema,
  ChangeRecordSchema,
  PeerModuleStateSchema,
  DeviceRevocationSchema,
  BlobRefSchema,
  BlobPolicyEntrySchema,
  SyncSessionSchema,
  ContentManifestSchema,
  SeedingPolicySchema,
} from './types';

// Providers
export { LocalOnlyProvider } from './providers/local-only';
export type { LocalOnlyProviderOptions } from './providers/local-only';

export { P2PProvider } from './providers/p2p';
export type {
  P2PProviderOptions,
  SignalingTransport,
  SignalingMessage,
} from './providers/p2p';

export { CloudProvider } from './providers/cloud';
export type {
  CloudProviderOptions,
  PowerSyncLike,
  SupabaseStorageClient,
} from './providers/cloud';

// Signaling / pairing
export {
  generatePairingCode,
  isValidPairingCode,
  createPairingSession,
  isPairingSessionExpired,
  PAIRING_CODE_TTL_MS,
} from './signaling/pairing';
export type { PairingCode, PairingSession } from './signaling/pairing';

export { WebRTCManager } from './signaling/webrtc';
export type {
  SDPDescription,
  ICECandidate,
  RTCPeerConnectionLike,
  RTCDataChannelLike,
  ConnectionState,
  WebRTCManagerOptions,
} from './signaling/webrtc';

// Changesets
export { applyChangeset } from './changeset';
export type { RowChange, Changeset } from './changeset';

// CRDT -- DocumentManager excluded (requires @automerge which uses Node's util)
export { ChangeTracker } from './crdt/change-tracker';
export type { ChangeTrackerOptions } from './crdt/change-tracker';

export { ConflictReporter } from './crdt/conflict-reporter';
export type { SyncConflict } from './crdt/conflict-reporter';

export {
  rowToCrdtData,
  crdtDataToSqlValues,
  buildInsertSql,
  buildUpdateSql,
  buildDeleteSql,
} from './crdt/schema-adapter';

// Blob policy (no Node deps)
export {
  getDefaultPolicy,
  shouldSyncBlob,
  ensureBlobPolicy,
} from './blob/blob-policy';
export type { NetworkConditions } from './blob/blob-policy';

// Database
export { SYNC_TABLES, TORRENT_TABLES, ALL_P2P_TABLES, createSyncTables } from './db/schema';
export { SYNC_MIGRATION } from './db/migration';
export * from './db/queries';

// React Hooks
export {
  useSyncProvider,
  useSyncStatus,
  useSetSyncTier,
  setSyncProvider,
  getSyncProvider,
  setTierChangeHandler,
  usePairedDevices,
  useSyncHistory,
  useModuleSyncSettings,
  useTorrentStatus,
} from './hooks';
export type { SetSyncTierFn } from './hooks';

// DB Integration -- excluded (SyncManager depends on SyncEngine -> automerge)
