/**
 * Transport manager that coordinates LAN and WAN transports.
 *
 * Auto-selects the best available transport for connecting to a peer:
 * LAN is preferred when the peer is discovered on the local network,
 * falling back to WAN/WebRTC when it is not.
 */

import type { TransportConnection, DiscoveredPeer } from '../types';
import { LANDiscovery } from './lan-discovery';
import type { LANDiscoveryOptions } from './lan-discovery';
import { LANTransport } from './lan-transport';

export interface TransportManagerOptions {
  /** This device's public key / identifier. */
  deviceId: string;
  /** Human-readable name for this device. */
  displayName: string;
  /** Port for LAN discovery and transport. */
  lanPort?: number;
  /** Called when a new peer is discovered on any transport. */
  onPeerDiscovered?: (peer: DiscoveredPeer) => void;
  /** Called when a peer is no longer reachable. */
  onPeerLost?: (deviceId: string) => void;
  /** Called when a new connection is established (inbound or outbound). */
  onConnection?: (connection: TransportConnection) => void;
}

/**
 * Coordinates all transport layers (LAN, and future WAN/WebRTC).
 *
 * Provides a single interface for:
 * - Discovering peers across all transports
 * - Connecting to peers using the best available transport
 * - Tracking active connections
 */
export class TransportManager {
  private readonly _options: TransportManagerOptions;
  private readonly _lanDiscovery: LANDiscovery;
  private readonly _lanTransport: LANTransport;
  private _initialized = false;
  private _destroyed = false;

  constructor(options: TransportManagerOptions) {
    this._options = options;

    const discoveryOpts: LANDiscoveryOptions = {
      deviceId: options.deviceId,
      displayName: options.displayName,
      port: options.lanPort,
    };

    this._lanDiscovery = new LANDiscovery(discoveryOpts);
    this._lanTransport = new LANTransport({
      listenPort: options.lanPort,
      onConnection: options.onConnection,
    });

    // Wire up discovery events
    this._lanDiscovery.on({
      onPeerFound: (peer) => {
        this._options.onPeerDiscovered?.(peer);
      },
      onPeerLost: (deviceId) => {
        this._options.onPeerLost?.(deviceId);
      },
    });
  }

  /** Whether the manager has been initialized. */
  get isInitialized(): boolean {
    return this._initialized;
  }

  /** Access the underlying LAN discovery instance (for testing / simulation). */
  get lanDiscovery(): LANDiscovery {
    return this._lanDiscovery;
  }

  /** Access the underlying LAN transport instance. */
  get lanTransport(): LANTransport {
    return this._lanTransport;
  }

  /**
   * Initialize all transport layers.
   *
   * Starts LAN discovery (advertising + browsing) and begins listening
   * for incoming LAN connections.
   */
  async initialize(): Promise<void> {
    this._assertNotDestroyed();
    if (this._initialized) return;

    this._lanDiscovery.startAdvertising();
    this._lanDiscovery.startBrowsing();
    await this._lanTransport.startListening();

    this._initialized = true;
  }

  /**
   * Connect to a peer using the best available transport.
   *
   * If the peer is visible on the LAN, uses a direct LAN connection.
   * In the future, this will fall back to WAN/WebRTC if the peer is
   * not on the local network.
   *
   * @throws Error if the peer is not discovered on any transport.
   */
  async connectToPeer(deviceId: string): Promise<TransportConnection> {
    this._assertNotDestroyed();

    // Check for existing connection
    const existing = this._lanTransport.getConnection(deviceId);
    if (existing) return existing;

    // Try LAN first
    const lanPeers = this._lanDiscovery.getVisiblePeers();
    const lanPeer = lanPeers.find((p) => p.deviceId === deviceId);

    if (lanPeer) {
      const connection = await this._lanTransport.connect(lanPeer);
      this._options.onConnection?.(connection);
      return connection;
    }

    // Phase 2: Try WAN/WebRTC here when signaling server is available.

    throw new Error(
      `Peer ${deviceId} is not reachable on any available transport.`,
    );
  }

  /** Get all discovered peers across all transports. */
  getDiscoveredPeers(): DiscoveredPeer[] {
    // Currently LAN-only. Phase 2 will merge WAN-discovered peers.
    return this._lanDiscovery.getVisiblePeers();
  }

  /** Get all active connections across all transports. */
  getActiveConnections(): TransportConnection[] {
    // Currently LAN-only. Phase 2 will merge WebRTC connections.
    return this._lanTransport.getConnections();
  }

  /** Check if a specific peer has an active connection. */
  isConnected(deviceId: string): boolean {
    return this._lanTransport.getConnection(deviceId) !== undefined;
  }

  /** Disconnect from a specific peer. */
  async disconnect(deviceId: string): Promise<void> {
    await this._lanTransport.closeConnection(deviceId);
  }

  /** Shut down all transports and clean up. */
  async destroy(): Promise<void> {
    if (this._destroyed) return;

    this._lanDiscovery.destroy();
    await this._lanTransport.destroy();

    this._initialized = false;
    this._destroyed = true;
  }

  private _assertNotDestroyed(): void {
    if (this._destroyed) {
      throw new Error('TransportManager has been destroyed.');
    }
  }
}
