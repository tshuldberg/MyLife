/**
 * Top-level sync coordinator.
 *
 * Orchestrates device discovery, connection, handshake, CRDT sync,
 * and blob transfer across all enabled modules. This is the main
 * entry point for the sync system.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type {
  DeviceIdentity,
  DiscoveredPeer,
  PairedDevice,
  TransportConnection,
} from '../types';
import { DocumentManager } from '../crdt/document-manager';
import { ChangeTracker } from '../crdt/change-tracker';
import { TransportManager } from '../transport/transport-manager';
import { SyncScheduler } from './sync-scheduler';
import { SyncStatusStore } from './sync-status';
import { runInitiatorSession } from '../protocol/sync-session';
import * as dbQueries from '../db/queries';

export interface SyncEngineOptions {
  db: DatabaseAdapter;
  identity: DeviceIdentity;
  /** Module ID to table prefix mapping. */
  modulePrefixes: Map<string, string>;
  /** List of enabled module IDs. */
  enabledModules: string[];
  /** Optional custom scheduler options. */
  schedulerOptions?: {
    minIntervalMs?: number;
    maxIntervalMs?: number;
    activeIntervalMs?: number;
  };
}

/**
 * Main sync engine coordinating all subsystems.
 */
export class SyncEngine {
  private readonly _db: DatabaseAdapter;
  private readonly _identity: DeviceIdentity;
  private readonly _enabledModules: string[];
  private readonly _documentManager: DocumentManager;
  private readonly _changeTracker: ChangeTracker;
  private readonly _transportManager: TransportManager;
  private readonly _scheduler: SyncScheduler;
  private readonly _statusStore: SyncStatusStore;
  private _initialized: boolean = false;
  private _destroyed: boolean = false;

  constructor(options: SyncEngineOptions) {
    this._db = options.db;
    this._identity = options.identity;
    this._enabledModules = [...options.enabledModules];

    this._documentManager = new DocumentManager();

    this._changeTracker = new ChangeTracker({
      db: options.db,
      deviceId: options.identity.publicKey,
      modulePrefixes: options.modulePrefixes,
      onChangeRecorded: () => {
        const count = this._changeTracker.getPendingCount();
        this._statusStore.setPendingChanges(count);
        this._scheduler.notifyChanges(count);
      },
    });

    this._transportManager = new TransportManager({
      deviceId: options.identity.publicKey,
      displayName: options.identity.displayName,
      onPeerDiscovered: (peer) => this._handlePeerDiscovered(peer),
      onPeerLost: (deviceId) => this._handlePeerLost(deviceId),
      onConnection: (conn) => this._handleIncomingConnection(conn),
    });

    this._scheduler = new SyncScheduler(options.schedulerOptions);
    this._statusStore = new SyncStatusStore();
  }

  /** Initialize the sync engine. Must be called before any sync operations. */
  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._assertNotDestroyed();

    this._statusStore.setState('discovering');

    // Initialize transport
    await this._transportManager.initialize();

    // Load paired devices count
    const paired = dbQueries.getPairedDevices(this._db);
    this._statusStore.setPairedDeviceCount(paired.length);

    // Load pending changes
    const pendingCount = this._changeTracker.getPendingCount();
    this._statusStore.setPendingChanges(pendingCount);

    // Start the sync scheduler
    this._scheduler.start(() => this._runSyncCycle());

    this._initialized = true;
    this._statusStore.setState('idle');
  }

  /** Trigger an immediate sync with all connected peers. */
  async syncNow(): Promise<void> {
    this._assertInitialized();
    await this._scheduler.syncNow();
  }

  /** Record a change from a module's SQLite write. */
  recordChange(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    rowId: string,
    data: Record<string, unknown> | null,
  ): void {
    this._assertInitialized();
    this._changeTracker.recordChange(table, operation, rowId, data);

    // Also update the CRDT document
    const moduleId = this._changeTracker.resolveModule(table);
    if (moduleId) {
      this._documentManager.applyChange(moduleId, {
        table,
        rowId,
        operation,
        data,
      });
    }
  }

  /** Pause syncing (e.g., app backgrounded). */
  pause(): void {
    this._scheduler.pause();
    this._statusStore.setState('idle');
  }

  /** Resume syncing. */
  resume(): void {
    this._scheduler.resume();
  }

  /** Get the current sync status. */
  getStatus(): ReturnType<SyncStatusStore['getStatus']> {
    return this._statusStore.getStatus();
  }

  /** Get the status store for React hook binding. */
  getStatusStore(): SyncStatusStore {
    return this._statusStore;
  }

  /** Get the change tracker. */
  getChangeTracker(): ChangeTracker {
    return this._changeTracker;
  }

  /** Get the document manager. */
  getDocumentManager(): DocumentManager {
    return this._documentManager;
  }

  /** Get discovered peers. */
  getDiscoveredPeers(): DiscoveredPeer[] {
    return this._transportManager.getDiscoveredPeers();
  }

  /** Get paired devices from the database. */
  getPairedDevices(): PairedDevice[] {
    return dbQueries.getPairedDevices(this._db);
  }

  /** Shut down the sync engine and release all resources. */
  async destroy(): Promise<void> {
    if (this._destroyed) return;
    this._destroyed = true;
    this._scheduler.stop();
    await this._transportManager.destroy();
    this._statusStore.setState('idle');
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private async _runSyncCycle(): Promise<void> {
    const connections = this._transportManager.getActiveConnections();
    if (connections.length === 0) {
      // Try to connect to any discovered peers that are paired
      const peers = this._transportManager.getDiscoveredPeers();
      const paired = dbQueries.getPairedDevices(this._db);
      const pairedIds = new Set(paired.filter((p) => p.isActive).map((p) => p.deviceId));

      for (const peer of peers) {
        if (pairedIds.has(peer.deviceId) && !this._transportManager.isConnected(peer.deviceId)) {
          try {
            const conn = await this._transportManager.connectToPeer(peer.deviceId);
            await this._syncWithPeer(conn, paired);
          } catch {
            // Connection failed, will retry next cycle
          }
        }
      }
    } else {
      // Sync with all connected peers
      const paired = dbQueries.getPairedDevices(this._db);
      for (const conn of connections) {
        await this._syncWithPeer(conn, paired);
      }
    }
  }

  private async _syncWithPeer(connection: TransportConnection, pairedDevices: PairedDevice[]): Promise<void> {
    this._statusStore.setState('syncing');
    this._statusStore.setCurrentSession(`sync_${Date.now()}`);

    try {
      const result = await runInitiatorSession(connection, {
        db: this._db,
        identity: this._identity,
        pairedDevices,
        documentManager: this._documentManager,
        changeTracker: this._changeTracker,
        enabledModules: this._enabledModules,
        transport: connection.transport,
      });
      this._statusStore.recordSync(result.session.id);
    } catch {
      this._statusStore.setState('error');
    }
  }

  private _handlePeerDiscovered(_peer: DiscoveredPeer): void {
    const onlineCount = this._transportManager.getDiscoveredPeers().length;
    this._statusStore.setOnlineDeviceCount(onlineCount);
  }

  private _handlePeerLost(_deviceId: string): void {
    const onlineCount = this._transportManager.getDiscoveredPeers().length;
    this._statusStore.setOnlineDeviceCount(onlineCount);
  }

  private _handleIncomingConnection(_connection: TransportConnection): void {
    // Phase 2: Run responder session for incoming connections
  }

  private _assertInitialized(): void {
    if (!this._initialized) throw new Error('SyncEngine not initialized. Call initialize() first.');
    this._assertNotDestroyed();
  }

  private _assertNotDestroyed(): void {
    if (this._destroyed) throw new Error('SyncEngine has been destroyed.');
  }
}
