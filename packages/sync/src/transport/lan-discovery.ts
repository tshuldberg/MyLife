/**
 * mDNS/DNS-SD service advertisement and browsing for LAN discovery.
 *
 * Discovers other MyLife devices on the local network using the
 * `_mylife-sync._tcp` service type. The actual mDNS implementation
 * requires native modules (react-native-zeroconf on mobile, mdns/bonjour
 * on Node), so this module defines the interface and provides a
 * mock/stub implementation that can be swapped at runtime.
 */

import type { DiscoveredPeer } from '../types';

export const MDNS_SERVICE_TYPE = '_mylife-sync._tcp';
export const MDNS_SERVICE_PORT = 42420;

export interface LANDiscoveryOptions {
  deviceId: string;
  displayName: string;
  port?: number;
}

/** Event callbacks for LAN discovery lifecycle. */
export interface LANDiscoveryEvents {
  onPeerFound: (peer: DiscoveredPeer) => void;
  onPeerLost: (deviceId: string) => void;
}

/**
 * LAN peer discovery via mDNS/DNS-SD.
 *
 * Advertises this device and browses for other MyLife devices on the
 * local network. Stores discovered peers in an in-memory Map keyed
 * by device ID.
 *
 * This implementation is a stub/mock. In production, swap the
 * `startAdvertising` and `startBrowsing` internals for calls to the
 * platform-specific mDNS library (react-native-zeroconf, mdns, bonjour).
 */
export class LANDiscovery {
  private readonly _deviceId: string;
  private readonly _displayName: string;
  private readonly _port: number;
  private readonly _peers: Map<string, DiscoveredPeer> = new Map();
  private _listeners: Partial<LANDiscoveryEvents> = {};
  private _advertising = false;
  private _browsing = false;
  private _destroyed = false;

  constructor(options: LANDiscoveryOptions) {
    this._deviceId = options.deviceId;
    this._displayName = options.displayName;
    this._port = options.port ?? MDNS_SERVICE_PORT;
  }

  /** Whether the service is currently advertising. */
  get isAdvertising(): boolean {
    return this._advertising;
  }

  /** Whether the service is currently browsing. */
  get isBrowsing(): boolean {
    return this._browsing;
  }

  /**
   * Start advertising this device on the local network.
   *
   * Stub: logs the advertisement. In production, this would register a
   * DNS-SD service record for `_mylife-sync._tcp` with the device's
   * public key as a TXT record field.
   */
  startAdvertising(): void {
    this._assertNotDestroyed();
    if (this._advertising) return;
    this._advertising = true;
    // Stub: real mDNS registration would happen here.
    // e.g. zeroconf.register(MDNS_SERVICE_TYPE, 'tcp', this._port, { deviceId: this._deviceId })
  }

  /** Stop advertising. */
  stopAdvertising(): void {
    if (!this._advertising) return;
    this._advertising = false;
    // Stub: real mDNS unregistration would happen here.
  }

  /**
   * Start browsing for other MyLife devices on the network.
   *
   * Stub: in production, this would start an mDNS browse for
   * `_mylife-sync._tcp` and fire `onPeerFound` for each resolved service.
   */
  startBrowsing(): void {
    this._assertNotDestroyed();
    if (this._browsing) return;
    this._browsing = true;
    // Stub: real mDNS browsing would happen here.
    // e.g. zeroconf.scan(MDNS_SERVICE_TYPE, 'tcp')
  }

  /** Stop browsing. */
  stopBrowsing(): void {
    if (!this._browsing) return;
    this._browsing = false;
    // Stub: real mDNS browse stop would happen here.
  }

  /** Get currently visible peers. */
  getVisiblePeers(): DiscoveredPeer[] {
    return Array.from(this._peers.values());
  }

  /** Register event handlers. */
  on(events: Partial<LANDiscoveryEvents>): void {
    this._listeners = { ...this._listeners, ...events };
  }

  /**
   * Simulate discovery of a peer. Used for testing and development
   * when real mDNS is not available.
   */
  simulateDiscovery(peer: DiscoveredPeer): void {
    this._assertNotDestroyed();
    // Ignore self-discovery
    if (peer.deviceId === this._deviceId) return;

    this._peers.set(peer.deviceId, peer);
    this._listeners.onPeerFound?.(peer);
  }

  /**
   * Simulate a peer leaving the network. Used for testing and
   * development when real mDNS is not available.
   */
  simulatePeerLost(deviceId: string): void {
    this._assertNotDestroyed();
    if (!this._peers.has(deviceId)) return;

    this._peers.delete(deviceId);
    this._listeners.onPeerLost?.(deviceId);
  }

  /** Clean up all resources. */
  destroy(): void {
    if (this._destroyed) return;
    this.stopAdvertising();
    this.stopBrowsing();
    this._peers.clear();
    this._listeners = {};
    this._destroyed = true;
  }

  private _assertNotDestroyed(): void {
    if (this._destroyed) {
      throw new Error('LANDiscovery has been destroyed.');
    }
  }
}
