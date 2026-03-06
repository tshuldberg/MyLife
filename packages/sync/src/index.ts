/**
 * @mylife/sync -- Data sync abstraction layer.
 *
 * Provides local-only, P2P (WebRTC), and cloud (PowerSync) sync
 * providers behind a unified SyncProvider interface.
 */

// Core types
export type {
  SyncTier,
  SyncStatus,
  SyncEvent,
  SyncEventListener,
  SyncProvider,
} from './types';
export { STORAGE_LIMITS, tierRequiresAuth, isCloudTier } from './types';

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

// React hooks
export {
  useSyncProvider,
  useSyncStatus,
  useSetSyncTier,
  setSyncProvider,
  getSyncProvider,
  setTierChangeHandler,
} from './hooks';
export type { SetSyncTierFn } from './hooks';

// DB integration
export { SyncManager, createSyncManager } from './db-integration';
export type { SyncManagerOptions } from './db-integration';
