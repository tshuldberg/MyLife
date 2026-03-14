/**
 * CRUD operations for all sync and torrent tables.
 *
 * All functions take a DatabaseAdapter and perform typed reads/writes
 * against the sync_ and torrent_ prefixed tables.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type {
  BlobPolicyEntry,
  BlobRef,
  BlobSyncPolicy,
  ChangeRecord,
  ContentManifest,
  DeviceIdentity,
  DeviceRevocation,
  PairedDevice,
  PeerModuleState,
  SeedingPolicy,
  SyncSession,
} from '../types';

// ---------------------------------------------------------------------------
// Device Identity
// ---------------------------------------------------------------------------

export function getDeviceIdentity(db: DatabaseAdapter): DeviceIdentity | null {
  const rows = db.query<{
    public_key: string;
    private_key_ref: string;
    dh_public_key: string;
    display_name: string;
    created_at: string;
  }>('SELECT public_key, private_key_ref, dh_public_key, display_name, created_at FROM sync_device_identity WHERE id = ?', ['self']);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    publicKey: r.public_key,
    privateKeyRef: r.private_key_ref,
    dhPublicKey: r.dh_public_key,
    displayName: r.display_name,
    createdAt: r.created_at,
  };
}

export function upsertDeviceIdentity(db: DatabaseAdapter, identity: DeviceIdentity): void {
  db.execute(
    `INSERT OR REPLACE INTO sync_device_identity (id, public_key, private_key_ref, dh_public_key, display_name, created_at)
     VALUES ('self', ?, ?, ?, ?, ?)`,
    [identity.publicKey, identity.privateKeyRef, identity.dhPublicKey, identity.displayName, identity.createdAt],
  );
}

// ---------------------------------------------------------------------------
// Paired Devices
// ---------------------------------------------------------------------------

export function getPairedDevices(db: DatabaseAdapter): PairedDevice[] {
  const rows = db.query<{
    device_id: string;
    display_name: string;
    dh_public_key: string;
    shared_secret_ref: string;
    last_seen_at: string | null;
    last_sync_at: string | null;
    last_sync_module: string | null;
    bytes_sent: number;
    bytes_received: number;
    is_active: number;
    paired_at: string;
  }>('SELECT * FROM sync_paired_devices ORDER BY paired_at DESC');
  return rows.map((r) => ({
    deviceId: r.device_id,
    displayName: r.display_name,
    dhPublicKey: r.dh_public_key,
    sharedSecretRef: r.shared_secret_ref,
    lastSeenAt: r.last_seen_at,
    lastSyncAt: r.last_sync_at,
    lastSyncModule: r.last_sync_module,
    bytesSent: r.bytes_sent,
    bytesReceived: r.bytes_received,
    isActive: r.is_active === 1,
    pairedAt: r.paired_at,
  }));
}

export function getPairedDevice(db: DatabaseAdapter, deviceId: string): PairedDevice | null {
  const rows = db.query<{
    device_id: string;
    display_name: string;
    dh_public_key: string;
    shared_secret_ref: string;
    last_seen_at: string | null;
    last_sync_at: string | null;
    last_sync_module: string | null;
    bytes_sent: number;
    bytes_received: number;
    is_active: number;
    paired_at: string;
  }>('SELECT * FROM sync_paired_devices WHERE device_id = ?', [deviceId]);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    deviceId: r.device_id,
    displayName: r.display_name,
    dhPublicKey: r.dh_public_key,
    sharedSecretRef: r.shared_secret_ref,
    lastSeenAt: r.last_seen_at,
    lastSyncAt: r.last_sync_at,
    lastSyncModule: r.last_sync_module,
    bytesSent: r.bytes_sent,
    bytesReceived: r.bytes_received,
    isActive: r.is_active === 1,
    pairedAt: r.paired_at,
  };
}

export function insertPairedDevice(db: DatabaseAdapter, device: PairedDevice): void {
  db.execute(
    `INSERT INTO sync_paired_devices (device_id, display_name, dh_public_key, shared_secret_ref, last_seen_at, last_sync_at, last_sync_module, bytes_sent, bytes_received, is_active, paired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      device.deviceId, device.displayName, device.dhPublicKey, device.sharedSecretRef,
      device.lastSeenAt, device.lastSyncAt, device.lastSyncModule,
      device.bytesSent, device.bytesReceived, device.isActive ? 1 : 0, device.pairedAt,
    ],
  );
}

export function updatePairedDeviceLastSeen(db: DatabaseAdapter, deviceId: string, at: string): void {
  db.execute('UPDATE sync_paired_devices SET last_seen_at = ? WHERE device_id = ?', [at, deviceId]);
}

export function updatePairedDeviceSyncStats(
  db: DatabaseAdapter,
  deviceId: string,
  opts: { lastSyncAt: string; lastSyncModule: string; bytesSent: number; bytesReceived: number },
): void {
  db.execute(
    `UPDATE sync_paired_devices
     SET last_sync_at = ?, last_sync_module = ?,
         bytes_sent = bytes_sent + ?, bytes_received = bytes_received + ?
     WHERE device_id = ?`,
    [opts.lastSyncAt, opts.lastSyncModule, opts.bytesSent, opts.bytesReceived, deviceId],
  );
}

export function deactivatePairedDevice(db: DatabaseAdapter, deviceId: string): void {
  db.execute('UPDATE sync_paired_devices SET is_active = 0 WHERE device_id = ?', [deviceId]);
}

// ---------------------------------------------------------------------------
// Change Log
// ---------------------------------------------------------------------------

export function insertChangeRecord(db: DatabaseAdapter, record: ChangeRecord): void {
  db.execute(
    `INSERT INTO sync_change_log (id, module_id, table_name, operation, row_id, data_json, device_id, timestamp, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id, record.moduleId, record.tableName, record.operation,
      record.rowId, record.dataJson, record.deviceId, record.timestamp,
      record.synced ? 1 : 0, record.createdAt,
    ],
  );
}

export function getUnsyncedChanges(db: DatabaseAdapter, limit = 100): ChangeRecord[] {
  const rows = db.query<{
    id: string;
    module_id: string;
    table_name: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    row_id: string;
    data_json: string | null;
    device_id: string;
    timestamp: number;
    synced: number;
    created_at: string;
  }>('SELECT * FROM sync_change_log WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?', [limit]);
  return rows.map((r) => ({
    id: r.id,
    moduleId: r.module_id,
    tableName: r.table_name,
    operation: r.operation,
    rowId: r.row_id,
    dataJson: r.data_json,
    deviceId: r.device_id,
    timestamp: r.timestamp,
    synced: r.synced === 1,
    createdAt: r.created_at,
  }));
}

export function getUnsyncedChangesByModule(db: DatabaseAdapter, moduleId: string, limit = 100): ChangeRecord[] {
  const rows = db.query<{
    id: string;
    module_id: string;
    table_name: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    row_id: string;
    data_json: string | null;
    device_id: string;
    timestamp: number;
    synced: number;
    created_at: string;
  }>('SELECT * FROM sync_change_log WHERE synced = 0 AND module_id = ? ORDER BY timestamp ASC LIMIT ?', [moduleId, limit]);
  return rows.map((r) => ({
    id: r.id,
    moduleId: r.module_id,
    tableName: r.table_name,
    operation: r.operation,
    rowId: r.row_id,
    dataJson: r.data_json,
    deviceId: r.device_id,
    timestamp: r.timestamp,
    synced: r.synced === 1,
    createdAt: r.created_at,
  }));
}

export function markChangesSynced(db: DatabaseAdapter, ids: string[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  db.execute(`UPDATE sync_change_log SET synced = 1 WHERE id IN (${placeholders})`, ids);
}

export function pruneOldSyncedChanges(db: DatabaseAdapter, olderThanTimestamp: number): number {
  const before = db.query<{ c: number }>('SELECT COUNT(*) as c FROM sync_change_log WHERE synced = 1 AND timestamp < ?', [olderThanTimestamp]);
  const count = before[0]?.c ?? 0;
  db.execute('DELETE FROM sync_change_log WHERE synced = 1 AND timestamp < ?', [olderThanTimestamp]);
  return count;
}

// ---------------------------------------------------------------------------
// Peer Module State
// ---------------------------------------------------------------------------

export function getPeerModuleState(db: DatabaseAdapter, deviceId: string, moduleId: string): PeerModuleState | null {
  const rows = db.query<{
    device_id: string;
    module_id: string;
    last_synced_version: number;
    last_synced_at: string | null;
    automerge_heads: string | null;
  }>('SELECT * FROM sync_peer_module_state WHERE device_id = ? AND module_id = ?', [deviceId, moduleId]);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    deviceId: r.device_id,
    moduleId: r.module_id,
    lastSyncedVersion: r.last_synced_version,
    lastSyncedAt: r.last_synced_at,
    automergeHeads: r.automerge_heads,
  };
}

export function upsertPeerModuleState(db: DatabaseAdapter, state: PeerModuleState): void {
  db.execute(
    `INSERT OR REPLACE INTO sync_peer_module_state (device_id, module_id, last_synced_version, last_synced_at, automerge_heads)
     VALUES (?, ?, ?, ?, ?)`,
    [state.deviceId, state.moduleId, state.lastSyncedVersion, state.lastSyncedAt, state.automergeHeads],
  );
}

// ---------------------------------------------------------------------------
// Device Revocations
// ---------------------------------------------------------------------------

export function insertRevocation(db: DatabaseAdapter, revocation: DeviceRevocation): void {
  db.execute(
    `INSERT INTO sync_device_revocations (device_id, revoked_by_device_id, reason, revoked_at)
     VALUES (?, ?, ?, ?)`,
    [revocation.deviceId, revocation.revokedByDeviceId, revocation.reason, revocation.revokedAt],
  );
}

export function isDeviceRevoked(db: DatabaseAdapter, deviceId: string): boolean {
  const rows = db.query<{ device_id: string }>('SELECT device_id FROM sync_device_revocations WHERE device_id = ?', [deviceId]);
  return rows.length > 0;
}

export function getRevocations(db: DatabaseAdapter): DeviceRevocation[] {
  const rows = db.query<{
    device_id: string;
    revoked_by_device_id: string;
    reason: string | null;
    revoked_at: string;
  }>('SELECT * FROM sync_device_revocations ORDER BY revoked_at DESC');
  return rows.map((r) => ({
    deviceId: r.device_id,
    revokedByDeviceId: r.revoked_by_device_id,
    reason: r.reason,
    revokedAt: r.revoked_at,
  }));
}

// ---------------------------------------------------------------------------
// Blobs
// ---------------------------------------------------------------------------

export function insertBlob(db: DatabaseAdapter, blob: BlobRef): void {
  db.execute(
    `INSERT OR IGNORE INTO sync_blobs (hash, size, mime_type, module_id, ref_count, stored_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [blob.hash, blob.size, blob.mimeType, blob.moduleId, blob.refCount, blob.storedAt],
  );
}

export function getBlob(db: DatabaseAdapter, hash: string): BlobRef | null {
  const rows = db.query<{
    hash: string;
    size: number;
    mime_type: string;
    module_id: string;
    ref_count: number;
    stored_at: string;
  }>('SELECT * FROM sync_blobs WHERE hash = ?', [hash]);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return { hash: r.hash, size: r.size, mimeType: r.mime_type, moduleId: r.module_id, refCount: r.ref_count, storedAt: r.stored_at };
}

export function getBlobsByModule(db: DatabaseAdapter, moduleId: string): BlobRef[] {
  const rows = db.query<{
    hash: string;
    size: number;
    mime_type: string;
    module_id: string;
    ref_count: number;
    stored_at: string;
  }>('SELECT * FROM sync_blobs WHERE module_id = ?', [moduleId]);
  return rows.map((r) => ({
    hash: r.hash, size: r.size, mimeType: r.mime_type, moduleId: r.module_id, refCount: r.ref_count, storedAt: r.stored_at,
  }));
}

export function incrementBlobRefCount(db: DatabaseAdapter, hash: string): void {
  db.execute('UPDATE sync_blobs SET ref_count = ref_count + 1 WHERE hash = ?', [hash]);
}

export function decrementBlobRefCount(db: DatabaseAdapter, hash: string): number {
  db.execute('UPDATE sync_blobs SET ref_count = ref_count - 1 WHERE hash = ?', [hash]);
  const rows = db.query<{ ref_count: number }>('SELECT ref_count FROM sync_blobs WHERE hash = ?', [hash]);
  return rows[0]?.ref_count ?? 0;
}

export function deleteBlob(db: DatabaseAdapter, hash: string): void {
  db.execute('DELETE FROM sync_blobs WHERE hash = ?', [hash]);
}

// ---------------------------------------------------------------------------
// Blob Policy
// ---------------------------------------------------------------------------

export function getBlobPolicy(db: DatabaseAdapter, moduleId: string): BlobPolicyEntry | null {
  const rows = db.query<{
    module_id: string;
    policy: BlobSyncPolicy;
    max_blob_size_bytes: number;
    updated_at: string;
  }>('SELECT * FROM sync_blob_policy WHERE module_id = ?', [moduleId]);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return { moduleId: r.module_id, policy: r.policy, maxBlobSizeBytes: r.max_blob_size_bytes, updatedAt: r.updated_at };
}

export function upsertBlobPolicy(db: DatabaseAdapter, entry: BlobPolicyEntry): void {
  db.execute(
    `INSERT OR REPLACE INTO sync_blob_policy (module_id, policy, max_blob_size_bytes, updated_at)
     VALUES (?, ?, ?, ?)`,
    [entry.moduleId, entry.policy, entry.maxBlobSizeBytes, entry.updatedAt],
  );
}

// ---------------------------------------------------------------------------
// Sync Sessions
// ---------------------------------------------------------------------------

export function insertSyncSession(db: DatabaseAdapter, session: SyncSession): void {
  db.execute(
    `INSERT INTO sync_sessions (id, peer_device_id, transport, direction, modules_synced, changes_sent, changes_received, bytes_sent, bytes_received, blobs_sent, blobs_received, duration_ms, status, error, started_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id, session.peerDeviceId, session.transport, session.direction,
      JSON.stringify(session.modulesSynced), session.changesSent, session.changesReceived,
      session.bytesSent, session.bytesReceived, session.blobsSent, session.blobsReceived,
      session.durationMs, session.status, session.error, session.startedAt, session.completedAt,
    ],
  );
}

export function getRecentSyncSessions(db: DatabaseAdapter, limit = 50): SyncSession[] {
  const rows = db.query<{
    id: string;
    peer_device_id: string;
    transport: 'lan' | 'wan_webrtc' | 'wan_relay';
    direction: 'push' | 'pull' | 'bidirectional';
    modules_synced: string;
    changes_sent: number;
    changes_received: number;
    bytes_sent: number;
    bytes_received: number;
    blobs_sent: number;
    blobs_received: number;
    duration_ms: number;
    status: 'completed' | 'partial' | 'failed';
    error: string | null;
    started_at: string;
    completed_at: string;
  }>('SELECT * FROM sync_sessions ORDER BY completed_at DESC LIMIT ?', [limit]);
  return rows.map((r) => ({
    id: r.id,
    peerDeviceId: r.peer_device_id,
    transport: r.transport,
    direction: r.direction,
    modulesSynced: JSON.parse(r.modules_synced) as string[],
    changesSent: r.changes_sent,
    changesReceived: r.changes_received,
    bytesSent: r.bytes_sent,
    bytesReceived: r.bytes_received,
    blobsSent: r.blobs_sent,
    blobsReceived: r.blobs_received,
    durationMs: r.duration_ms,
    status: r.status,
    error: r.error,
    startedAt: r.started_at,
    completedAt: r.completed_at,
  }));
}

// ---------------------------------------------------------------------------
// Seeding Policy
// ---------------------------------------------------------------------------

export function getSeedingPolicy(db: DatabaseAdapter): SeedingPolicy | null {
  const rows = db.query<{
    enabled: number;
    max_upload_kbps: number;
    max_seed_storage_mb: number;
    auto_delete_days: number;
    seed_on_cellular: number;
    seed_while_charging: number;
    updated_at: string;
  }>('SELECT * FROM torrent_seeding_policy WHERE id = ?', ['config']);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    enabled: r.enabled === 1,
    maxUploadKbps: r.max_upload_kbps,
    maxSeedStorageMB: r.max_seed_storage_mb,
    autoDeleteDays: r.auto_delete_days,
    seedOnCellular: r.seed_on_cellular === 1,
    seedWhileCharging: r.seed_while_charging === 1,
    updatedAt: r.updated_at,
  };
}

export function upsertSeedingPolicy(db: DatabaseAdapter, policy: SeedingPolicy): void {
  db.execute(
    `INSERT OR REPLACE INTO torrent_seeding_policy (id, enabled, max_upload_kbps, max_seed_storage_mb, auto_delete_days, seed_on_cellular, seed_while_charging, updated_at)
     VALUES ('config', ?, ?, ?, ?, ?, ?, ?)`,
    [
      policy.enabled ? 1 : 0, policy.maxUploadKbps, policy.maxSeedStorageMB,
      policy.autoDeleteDays, policy.seedOnCellular ? 1 : 0, policy.seedWhileCharging ? 1 : 0,
      policy.updatedAt,
    ],
  );
}

// ---------------------------------------------------------------------------
// Torrent Published
// ---------------------------------------------------------------------------

export function insertPublishedContent(db: DatabaseAdapter, manifest: ContentManifest, contentKey?: string): void {
  db.execute(
    `INSERT INTO torrent_published (info_hash, title, description, category, tags_json, access, price_cents, currency, total_size, piece_length, pieces_json, merkle_root, files_json, manifest_json, content_key, trackers_json, web_seeds_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      manifest.infoHash, manifest.title, manifest.description, manifest.category,
      JSON.stringify(manifest.tags), manifest.access,
      manifest.price ? Math.round(manifest.price.amount * 100) : null,
      manifest.price?.currency ?? 'USD',
      manifest.totalSize, manifest.pieceLength, JSON.stringify(manifest.pieces),
      manifest.merkleRoot, JSON.stringify(manifest.files), JSON.stringify(manifest),
      contentKey ?? null, JSON.stringify(manifest.trackers), JSON.stringify(manifest.webSeeds),
    ],
  );
}

// ---------------------------------------------------------------------------
// Torrent Downloads
// ---------------------------------------------------------------------------

export function insertDownload(
  db: DatabaseAdapter,
  manifest: ContentManifest,
  storagePath: string,
  contentKey?: string,
  accessToken?: string,
): void {
  db.execute(
    `INSERT INTO torrent_downloads (info_hash, title, description, category, creator_public_key, creator_display_name, total_size, piece_count, manifest_json, content_key, access_token, storage_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      manifest.infoHash, manifest.title, manifest.description, manifest.category,
      manifest.creator.publicKey, manifest.creator.displayName,
      manifest.totalSize, manifest.pieces.length, JSON.stringify(manifest),
      contentKey ?? null, accessToken ?? null, storagePath,
    ],
  );
}

export function updateDownloadProgress(db: DatabaseAdapter, infoHash: string, downloadedSize: number, piecesCompleted: number): void {
  db.execute(
    `UPDATE torrent_downloads SET downloaded_size = ?, pieces_completed = ? WHERE info_hash = ?`,
    [downloadedSize, piecesCompleted, infoHash],
  );
}

export function completeDownload(db: DatabaseAdapter, infoHash: string): void {
  const now = new Date().toISOString();
  db.execute(
    `UPDATE torrent_downloads SET status = 'completed', completed_at = ?, downloaded_at = ? WHERE info_hash = ?`,
    [now, now, infoHash],
  );
}
