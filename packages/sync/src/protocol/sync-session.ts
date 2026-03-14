/**
 * Full sync session orchestration.
 *
 * A sync session connects to a peer, performs the handshake, then
 * exchanges CRDT sync messages and blob data for each enabled module.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type {
  DeviceIdentity,
  PairedDevice,
  SyncSession,
  SyncTransport,
  TransportConnection,
} from '../types';
import { DocumentManager } from '../crdt/document-manager';
import { ChangeTracker } from '../crdt/change-tracker';
import * as queries from '../db/queries';
import { initiatorHandshake, responderHandshake } from './handshake';
import {
  encodeMessage,
  decodeMessage,
  createJsonMessage,
  createSimpleMessage,
  parseJsonPayload,
} from './message-codec';

export interface SyncSessionOptions {
  db: DatabaseAdapter;
  identity: DeviceIdentity;
  pairedDevices: PairedDevice[];
  documentManager: DocumentManager;
  changeTracker: ChangeTracker;
  enabledModules: string[];
  transport: SyncTransport;
}

interface SyncSessionResult {
  session: SyncSession;
  modulesUpdated: string[];
}

/**
 * Run a full sync session as the initiator.
 */
export async function runInitiatorSession(
  connection: TransportConnection,
  options: SyncSessionOptions,
): Promise<SyncSessionResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let changesSent = 0;
  let changesReceived = 0;
  let bytesSent = 0;
  let bytesReceived = 0;
  const modulesUpdated: string[] = [];

  // Handshake
  const handshake = await initiatorHandshake(
    connection,
    options.identity,
    options.pairedDevices,
    options.enabledModules,
  );

  if (!handshake.success) {
    const session = buildSession({
      peerDeviceId: handshake.remoteDeviceId || 'unknown',
      transport: options.transport,
      startedAt,
      durationMs: Date.now() - startTime,
      status: 'failed',
      error: handshake.error ?? 'Handshake failed',
      modulesSynced: [],
      changesSent: 0,
      changesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
    });
    queries.insertSyncSession(options.db, session);
    return { session, modulesUpdated: [] };
  }

  // Sync each module
  for (const moduleId of options.enabledModules) {
    const result = await syncModule(
      connection,
      options,
      moduleId,
      handshake.remoteDeviceId,
    );
    changesSent += result.sent;
    changesReceived += result.received;
    bytesSent += result.bytesSent;
    bytesReceived += result.bytesReceived;
    if (result.received > 0) modulesUpdated.push(moduleId);
  }

  // Send BYE
  const byeMsg = createSimpleMessage('BYE', options.identity.publicKey, '');
  const byeBytes = encodeMessage(byeMsg);
  await connection.send(byeBytes);

  // Mark changes as synced
  const unsyncedIds = options.changeTracker
    .getUnsynced()
    .map((c) => c.id);
  if (unsyncedIds.length > 0) {
    options.changeTracker.markSynced(unsyncedIds);
  }

  const session = buildSession({
    peerDeviceId: handshake.remoteDeviceId,
    transport: options.transport,
    startedAt,
    durationMs: Date.now() - startTime,
    status: 'completed',
    error: null,
    modulesSynced: options.enabledModules,
    changesSent,
    changesReceived,
    bytesSent,
    bytesReceived,
  });
  queries.insertSyncSession(options.db, session);

  // Update peer stats
  queries.updatePairedDeviceSyncStats(options.db, handshake.remoteDeviceId, {
    lastSyncAt: new Date().toISOString(),
    lastSyncModule: modulesUpdated[modulesUpdated.length - 1] ?? options.enabledModules[0] ?? '',
    bytesSent,
    bytesReceived,
  });

  return { session, modulesUpdated };
}

/**
 * Run a full sync session as the responder.
 */
export async function runResponderSession(
  connection: TransportConnection,
  options: SyncSessionOptions,
): Promise<SyncSessionResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const modulesUpdated: string[] = [];

  const handshake = await responderHandshake(
    connection,
    options.identity,
    options.pairedDevices,
    options.enabledModules,
  );

  if (!handshake.success) {
    const session = buildSession({
      peerDeviceId: handshake.remoteDeviceId || 'unknown',
      transport: options.transport,
      startedAt,
      durationMs: Date.now() - startTime,
      status: 'failed',
      error: handshake.error ?? 'Handshake failed',
      modulesSynced: [],
      changesSent: 0,
      changesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
    });
    queries.insertSyncSession(options.db, session);
    return { session, modulesUpdated: [] };
  }

  // Wait for sync messages from the initiator
  let totalReceived = 0;
  let totalSent = 0;
  let totalBytesReceived = 0;
  let totalBytesSent = 0;

  // Process incoming sync messages until BYE
  let done = false;
  const dataHandler = (data: Uint8Array) => {
    const msg = decodeMessage(data);
    if (!msg) return;

    if (msg.type === 'BYE') {
      done = true;
      return;
    }

    if (msg.type === 'SYNC_DATA') {
      const payload = parseJsonPayload<{ moduleId: string; syncData: number[] }>(msg);
      if (payload) {
        const syncData = new Uint8Array(payload.syncData);
        const changes = options.documentManager.receiveSyncMessage(
          payload.moduleId,
          syncData,
        );
        totalReceived += changes.length;
        totalBytesReceived += data.length;
        if (changes.length > 0) modulesUpdated.push(payload.moduleId);
      }
    }
  };
  connection.onData(dataHandler);

  // Wait for completion (with timeout)
  const waitStart = Date.now();
  while (!done && Date.now() - waitStart < 60_000) {
    await new Promise((r) => setTimeout(r, 100));
  }

  const session = buildSession({
    peerDeviceId: handshake.remoteDeviceId,
    transport: options.transport,
    startedAt,
    durationMs: Date.now() - startTime,
    status: done ? 'completed' : 'partial',
    error: done ? null : 'Timeout waiting for BYE',
    modulesSynced: options.enabledModules,
    changesSent: totalSent,
    changesReceived: totalReceived,
    bytesSent: totalBytesSent,
    bytesReceived: totalBytesReceived,
  });
  queries.insertSyncSession(options.db, session);

  return { session, modulesUpdated };
}

/**
 * Sync a single module's CRDT document with a peer.
 */
async function syncModule(
  connection: TransportConnection,
  options: SyncSessionOptions,
  moduleId: string,
  remoteDeviceId: string,
): Promise<{ sent: number; received: number; bytesSent: number; bytesReceived: number }> {
  // Get peer's known sync state
  const peerState = queries.getPeerModuleState(options.db, remoteDeviceId, moduleId);
  const peerSyncState = peerState?.automergeHeads
    ? new Uint8Array(JSON.parse(peerState.automergeHeads))
    : null;

  // Generate sync message (what peer is missing)
  const syncMessage = options.documentManager.generateSyncMessage(moduleId, peerSyncState);
  let sent = 0;
  let bytesSent = 0;

  if (syncMessage) {
    const msg = createJsonMessage(
      'SYNC_DATA',
      options.identity.publicKey,
      '',
      { moduleId, syncData: Array.from(syncMessage) },
    );
    const encoded = encodeMessage(msg);
    await connection.send(encoded);
    sent = 1;
    bytesSent = encoded.length;
  }

  // Update peer module state
  const docState = options.documentManager.getSyncState(moduleId);
  queries.upsertPeerModuleState(options.db, {
    deviceId: remoteDeviceId,
    moduleId,
    lastSyncedVersion: (peerState?.lastSyncedVersion ?? 0) + 1,
    lastSyncedAt: new Date().toISOString(),
    automergeHeads: JSON.stringify(Array.from(docState)),
  });

  return { sent, received: 0, bytesSent, bytesReceived: 0 };
}

function buildSession(opts: {
  peerDeviceId: string;
  transport: SyncTransport;
  startedAt: string;
  durationMs: number;
  status: 'completed' | 'partial' | 'failed';
  error: string | null;
  modulesSynced: string[];
  changesSent: number;
  changesReceived: number;
  bytesSent: number;
  bytesReceived: number;
}): SyncSession {
  return {
    id: `ss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    peerDeviceId: opts.peerDeviceId,
    transport: opts.transport,
    direction: 'bidirectional',
    modulesSynced: opts.modulesSynced,
    changesSent: opts.changesSent,
    changesReceived: opts.changesReceived,
    bytesSent: opts.bytesSent,
    bytesReceived: opts.bytesReceived,
    blobsSent: 0,
    blobsReceived: 0,
    durationMs: opts.durationMs,
    status: opts.status,
    error: opts.error,
    startedAt: opts.startedAt,
    completedAt: new Date().toISOString(),
  };
}
