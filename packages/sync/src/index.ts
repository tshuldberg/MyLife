/**
 * @mylife/sync -- Data sync abstraction layer.
 *
 * Provides local-only, P2P (WebRTC), and cloud (PowerSync) sync
 * providers behind a unified SyncProvider interface. Includes the
 * full P2P sync engine, CRDT-based conflict resolution, blob storage,
 * transport layer, and content distribution (torrent) subsystem.
 */

// Core types
export type {
  SyncTier,
  SyncStatus,
  SyncEvent,
  SyncEventListener,
  SyncProvider,
  // P2P types
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
  // Torrent types
  ContentAccess,
  ContentCategory,
  ContentManifest,
  SeedingPolicy,
  TorrentDownloadStatus,
  TorrentPieceStatus,
  TorrentPaymentDirection,
  TorrentPaymentStatus,
  // Transport types
  TransportConnection,
  DiscoveredPeer,
  // Engine types
  SyncEngineState,
  SyncEngineStatus,
} from './types';
export {
  STORAGE_LIMITS,
  tierRequiresAuth,
  isCloudTier,
  // Zod schemas
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

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Signaling / pairing (legacy, kept for backward compatibility)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Changesets (LWW fallback)
// ---------------------------------------------------------------------------

export { applyChangeset } from './changeset';
export type { RowChange, Changeset } from './changeset';

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export {
  generateDeviceIdentity,
  getDeviceId,
  signMessage,
  verifySignature,
  getPublicKeyFingerprint,
} from './identity/device-identity';

export {
  createPairingPayload,
  validatePairingCode,
  derivePairingSharedSecret,
  completePairing,
} from './identity/pairing';
export type { PairingData } from './identity/pairing';

export { createRevocation, isRevoked } from './identity/revocation';

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

export {
  hexToBytes,
  bytesToHex,
  deriveKey,
  generateNonce,
  generateSessionKey,
} from './encryption/keys';

export {
  encrypt,
  decrypt,
  encryptString,
  decryptString,
} from './encryption/encrypt';

export { NoiseHandshake } from './encryption/noise-handshake';

// ---------------------------------------------------------------------------
// CRDT
// ---------------------------------------------------------------------------

export { DocumentManager } from './crdt/document-manager';
export type { ModuleDocument, DocumentChange } from './crdt/document-manager';

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

// ---------------------------------------------------------------------------
// Blob Storage
// ---------------------------------------------------------------------------

export { BlobStore } from './blob/blob-store';
export type { BlobStoreOptions } from './blob/blob-store';

export {
  splitIntoBlocks,
  reassembleBlocks,
  verifyBlob,
  getMissingBlockIndices,
  BLOCK_SIZE,
} from './blob/blob-sync';
export type { BlobBlock } from './blob/blob-sync';

export {
  getDefaultPolicy,
  shouldSyncBlob,
  ensureBlobPolicy,
} from './blob/blob-policy';
export type { NetworkConditions } from './blob/blob-policy';

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export { LANDiscovery, MDNS_SERVICE_TYPE, MDNS_SERVICE_PORT } from './transport/lan-discovery';
export type { LANDiscoveryOptions, LANDiscoveryEvents } from './transport/lan-discovery';

export { LANTransport } from './transport/lan-transport';
export type { LANTransportOptions } from './transport/lan-transport';

export { TransportManager } from './transport/transport-manager';
export type { TransportManagerOptions } from './transport/transport-manager';

export { SignalingClient } from './transport/signaling-client';
export type {
  SignalingClientOptions,
  SignalingMessage as TransportSignalingMessage,
} from './transport/signaling-client';

// ---------------------------------------------------------------------------
// Protocol
// ---------------------------------------------------------------------------

export { encodeMessage, decodeMessage, createSimpleMessage, createJsonMessage, parseJsonPayload } from './protocol/message-codec';
export { initiatorHandshake, responderHandshake } from './protocol/handshake';
export { runInitiatorSession, runResponderSession } from './protocol/sync-session';
export { PushRelayClient } from './protocol/push-relay-client';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export { SyncEngine } from './engine/sync-engine';
export { SyncScheduler } from './engine/sync-scheduler';
export { SyncStatusStore } from './engine/sync-status';

// ---------------------------------------------------------------------------
// Torrent / Content Distribution
// ---------------------------------------------------------------------------

export { createManifest, verifyManifest, parseManifest, computeMerkleRoot } from './torrent/manifest';
export { publishContent, generateMagnetUri } from './torrent/publisher';
export type { PublishOptions, PublishResult } from './torrent/publisher';

export { TorrentDownloader } from './torrent/downloader';
export type { DownloadOptions, DownloadState, DownloadProgress } from './torrent/downloader';

export { SeedingEngine } from './torrent/seeder';
export type { SeedEntry } from './torrent/seeder';

export { PieceManager } from './torrent/piece-manager';
export { TrackerClient } from './torrent/tracker-client';
export type { AnnounceParams, TrackerPeer, ScrapeResult, TrackerClientOptions } from './torrent/tracker-client';

export { SwarmManager } from './torrent/swarm-manager';
export type { SwarmPeer } from './torrent/swarm-manager';

export { PaidContentManager } from './torrent/paid-content';
export type { PaymentRecord, PaymentRequest, PaymentVerification } from './torrent/paid-content';

export { WebSeedClient } from './torrent/web-seed';
export type { WebSeedOptions, WebSeedDownload } from './torrent/web-seed';

export {
  parseDeepLink,
  parseMagnetUri,
  generateShareLink,
  generateDeepLink,
  generateMagnetUri as generateTorrentMagnetUri,
  isTorrentLink,
} from './torrent/deep-link';
export type { ParsedDeepLink } from './torrent/deep-link';

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export { SYNC_TABLES, TORRENT_TABLES, ALL_P2P_TABLES, createSyncTables } from './db/schema';
export { SYNC_MIGRATION } from './db/migration';
export * from './db/queries';

// ---------------------------------------------------------------------------
// React Hooks
// ---------------------------------------------------------------------------

export {
  useSyncProvider,
  useSyncStatus,
  useSetSyncTier,
  setSyncProvider,
  getSyncProvider,
  setTierChangeHandler,
  // New P2P hooks
  usePairedDevices,
  useSyncHistory,
  useModuleSyncSettings,
  useTorrentStatus,
} from './hooks';
export type { SetSyncTierFn } from './hooks';

// ---------------------------------------------------------------------------
// DB Integration
// ---------------------------------------------------------------------------

export { SyncManager, createSyncManager } from './db-integration';
export type { SyncManagerOptions } from './db-integration';
