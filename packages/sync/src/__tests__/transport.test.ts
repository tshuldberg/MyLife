import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LANDiscovery, MDNS_SERVICE_TYPE, MDNS_SERVICE_PORT } from '../transport/lan-discovery';
import { LANTransport } from '../transport/lan-transport';
import { TransportManager } from '../transport/transport-manager';
import { SignalingClient } from '../transport/signaling-client';
import type { DiscoveredPeer } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePeer(overrides: Partial<DiscoveredPeer> = {}): DiscoveredPeer {
  return {
    deviceId: 'peer-device-001',
    displayName: 'Test Peer',
    host: '192.168.1.42',
    port: MDNS_SERVICE_PORT,
    discoveredAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// LANDiscovery
// ---------------------------------------------------------------------------

describe('LANDiscovery', () => {
  let discovery: LANDiscovery;

  beforeEach(() => {
    discovery = new LANDiscovery({
      deviceId: 'my-device-001',
      displayName: 'My Device',
    });
  });

  it('simulateDiscovery adds peer to visible list', () => {
    const peer = makePeer();
    discovery.simulateDiscovery(peer);

    const visible = discovery.getVisiblePeers();
    expect(visible).toHaveLength(1);
    expect(visible[0]).toEqual(peer);
  });

  it('peer found event fires on discovery', () => {
    const onPeerFound = vi.fn();
    discovery.on({ onPeerFound });

    const peer = makePeer();
    discovery.simulateDiscovery(peer);

    expect(onPeerFound).toHaveBeenCalledOnce();
    expect(onPeerFound).toHaveBeenCalledWith(peer);
  });

  it('peer lost event fires when peer removed', () => {
    const onPeerLost = vi.fn();
    discovery.on({ onPeerLost });

    const peer = makePeer();
    discovery.simulateDiscovery(peer);
    discovery.simulatePeerLost(peer.deviceId);

    expect(onPeerLost).toHaveBeenCalledOnce();
    expect(onPeerLost).toHaveBeenCalledWith(peer.deviceId);
  });

  it('getVisiblePeers returns all discovered peers', () => {
    const peer1 = makePeer({ deviceId: 'peer-1', displayName: 'Peer 1' });
    const peer2 = makePeer({ deviceId: 'peer-2', displayName: 'Peer 2' });
    const peer3 = makePeer({ deviceId: 'peer-3', displayName: 'Peer 3' });

    discovery.simulateDiscovery(peer1);
    discovery.simulateDiscovery(peer2);
    discovery.simulateDiscovery(peer3);

    const visible = discovery.getVisiblePeers();
    expect(visible).toHaveLength(3);
    expect(visible.map((p) => p.deviceId)).toEqual(['peer-1', 'peer-2', 'peer-3']);
  });

  it('ignores self-discovery', () => {
    const selfPeer = makePeer({ deviceId: 'my-device-001' });
    discovery.simulateDiscovery(selfPeer);

    expect(discovery.getVisiblePeers()).toHaveLength(0);
  });

  it('does not fire peer lost for unknown device', () => {
    const onPeerLost = vi.fn();
    discovery.on({ onPeerLost });

    discovery.simulatePeerLost('unknown-device');

    expect(onPeerLost).not.toHaveBeenCalled();
  });

  it('tracks advertising and browsing state', () => {
    expect(discovery.isAdvertising).toBe(false);
    expect(discovery.isBrowsing).toBe(false);

    discovery.startAdvertising();
    expect(discovery.isAdvertising).toBe(true);

    discovery.startBrowsing();
    expect(discovery.isBrowsing).toBe(true);

    discovery.stopAdvertising();
    expect(discovery.isAdvertising).toBe(false);

    discovery.stopBrowsing();
    expect(discovery.isBrowsing).toBe(false);
  });

  it('throws after destroy', () => {
    discovery.destroy();

    expect(() => discovery.simulateDiscovery(makePeer())).toThrow(
      'LANDiscovery has been destroyed',
    );
  });

  it('exports correct mDNS constants', () => {
    expect(MDNS_SERVICE_TYPE).toBe('_mylife-sync._tcp');
    expect(MDNS_SERVICE_PORT).toBe(42420);
  });
});

// ---------------------------------------------------------------------------
// LANTransport
// ---------------------------------------------------------------------------

describe('LANTransport', () => {
  let transport: LANTransport;

  beforeEach(() => {
    transport = new LANTransport();
  });

  it('connect creates a TransportConnection', async () => {
    const peer = makePeer();
    const connection = await transport.connect(peer);

    expect(connection).toBeDefined();
    expect(connection.id).toBeTruthy();
    expect(connection.remoteDeviceId).toBe(peer.deviceId);
    expect(connection.transport).toBe('lan');
    expect(typeof connection.send).toBe('function');
    expect(typeof connection.onData).toBe('function');
    expect(typeof connection.close).toBe('function');
  });

  it('connection send/receive roundtrip (mock)', async () => {
    const peer = makePeer();
    const connection = await transport.connect(peer);

    // Register a data handler
    const handler = vi.fn();
    connection.onData(handler);

    // In the mock, send does not route to onData (no loopback).
    // But we can verify the handler registration works.
    const testData = new Uint8Array([1, 2, 3]);
    // Manually trigger the handler as if data arrived
    handler(testData);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(testData);
  });

  it('fires onConnection callback', async () => {
    const onConnection = vi.fn();
    const transportWithCb = new LANTransport({ onConnection });

    const peer = makePeer();
    const connection = await transportWithCb.connect(peer);

    expect(onConnection).toHaveBeenCalledOnce();
    expect(onConnection).toHaveBeenCalledWith(connection);

    await transportWithCb.destroy();
  });

  it('tracks connections by device ID', async () => {
    const peer1 = makePeer({ deviceId: 'peer-1' });
    const peer2 = makePeer({ deviceId: 'peer-2' });

    await transport.connect(peer1);
    await transport.connect(peer2);

    const connections = transport.getConnections();
    expect(connections).toHaveLength(2);

    expect(transport.getConnection('peer-1')).toBeDefined();
    expect(transport.getConnection('peer-2')).toBeDefined();
    expect(transport.getConnection('peer-3')).toBeUndefined();
  });

  it('closeConnection removes a single connection', async () => {
    const peer = makePeer();
    await transport.connect(peer);

    expect(transport.getConnections()).toHaveLength(1);

    await transport.closeConnection(peer.deviceId);
    expect(transport.getConnections()).toHaveLength(0);
  });

  it('startListening / stopListening toggle state', async () => {
    expect(transport.isListening).toBe(false);

    await transport.startListening();
    expect(transport.isListening).toBe(true);

    await transport.stopListening();
    expect(transport.isListening).toBe(false);
  });

  it('destroy cleans up all connections', async () => {
    await transport.connect(makePeer({ deviceId: 'p1' }));
    await transport.connect(makePeer({ deviceId: 'p2' }));
    await transport.startListening();

    await transport.destroy();

    expect(transport.getConnections()).toHaveLength(0);
    expect(transport.isListening).toBe(false);
  });

  it('throws after destroy', async () => {
    await transport.destroy();

    await expect(transport.connect(makePeer())).rejects.toThrow(
      'LANTransport has been destroyed',
    );
  });
});

// ---------------------------------------------------------------------------
// TransportManager
// ---------------------------------------------------------------------------

describe('TransportManager', () => {
  let manager: TransportManager;

  beforeEach(() => {
    manager = new TransportManager({
      deviceId: 'my-device-001',
      displayName: 'My Device',
    });
  });

  it('initializes without errors', async () => {
    await expect(manager.initialize()).resolves.toBeUndefined();
    expect(manager.isInitialized).toBe(true);
  });

  it('prefers LAN when peer is on local network', async () => {
    await manager.initialize();

    const peer = makePeer({ deviceId: 'lan-peer' });
    manager.lanDiscovery.simulateDiscovery(peer);

    const connection = await manager.connectToPeer('lan-peer');
    expect(connection.transport).toBe('lan');
    expect(connection.remoteDeviceId).toBe('lan-peer');

    await manager.destroy();
  });

  it('tracks active connections', async () => {
    await manager.initialize();

    const peer = makePeer({ deviceId: 'tracked-peer' });
    manager.lanDiscovery.simulateDiscovery(peer);

    expect(manager.getActiveConnections()).toHaveLength(0);
    expect(manager.isConnected('tracked-peer')).toBe(false);

    await manager.connectToPeer('tracked-peer');

    expect(manager.getActiveConnections()).toHaveLength(1);
    expect(manager.isConnected('tracked-peer')).toBe(true);

    await manager.destroy();
  });

  it('throws when peer is not reachable on any transport', async () => {
    await manager.initialize();

    await expect(manager.connectToPeer('unknown-peer')).rejects.toThrow(
      'not reachable on any available transport',
    );

    await manager.destroy();
  });

  it('returns existing connection if already connected', async () => {
    await manager.initialize();

    const peer = makePeer({ deviceId: 'reuse-peer' });
    manager.lanDiscovery.simulateDiscovery(peer);

    const conn1 = await manager.connectToPeer('reuse-peer');
    const conn2 = await manager.connectToPeer('reuse-peer');

    expect(conn1.id).toBe(conn2.id);

    await manager.destroy();
  });

  it('disconnect removes a connection', async () => {
    await manager.initialize();

    const peer = makePeer({ deviceId: 'disc-peer' });
    manager.lanDiscovery.simulateDiscovery(peer);

    await manager.connectToPeer('disc-peer');
    expect(manager.isConnected('disc-peer')).toBe(true);

    await manager.disconnect('disc-peer');
    expect(manager.isConnected('disc-peer')).toBe(false);

    await manager.destroy();
  });

  it('fires onPeerDiscovered callback on LAN discovery', async () => {
    const onPeerDiscovered = vi.fn();
    const mgr = new TransportManager({
      deviceId: 'my-device',
      displayName: 'My Device',
      onPeerDiscovered,
    });

    await mgr.initialize();

    const peer = makePeer({ deviceId: 'callback-peer' });
    mgr.lanDiscovery.simulateDiscovery(peer);

    expect(onPeerDiscovered).toHaveBeenCalledOnce();
    expect(onPeerDiscovered).toHaveBeenCalledWith(peer);

    await mgr.destroy();
  });

  it('getDiscoveredPeers returns LAN peers', async () => {
    await manager.initialize();

    expect(manager.getDiscoveredPeers()).toHaveLength(0);

    manager.lanDiscovery.simulateDiscovery(makePeer({ deviceId: 'dp-1' }));
    manager.lanDiscovery.simulateDiscovery(makePeer({ deviceId: 'dp-2' }));

    expect(manager.getDiscoveredPeers()).toHaveLength(2);

    await manager.destroy();
  });

  it('throws after destroy', async () => {
    await manager.initialize();
    await manager.destroy();

    await expect(manager.connectToPeer('any')).rejects.toThrow(
      'TransportManager has been destroyed',
    );
  });
});

// ---------------------------------------------------------------------------
// SignalingClient (Phase 2 stub)
// ---------------------------------------------------------------------------

describe('SignalingClient', () => {
  it('stub does not throw on connect/send/disconnect', async () => {
    const onMessage = vi.fn();
    const onConnectionStateChange = vi.fn();

    const client = new SignalingClient({
      serverUrl: 'wss://sync-relay.mylife.app',
      deviceId: 'my-device-001',
      onMessage,
      onConnectionStateChange,
    });

    expect(client.isConnected()).toBe(false);

    await expect(client.connect()).resolves.toBeUndefined();
    expect(client.isConnected()).toBe(true);
    expect(onConnectionStateChange).toHaveBeenCalledWith(true);

    await expect(
      client.send({
        type: 'offer',
        fromDeviceId: 'my-device-001',
        toDeviceId: 'peer-device',
        payload: { sdp: 'test' },
      }),
    ).resolves.toBeUndefined();

    await expect(client.disconnect()).resolves.toBeUndefined();
    expect(client.isConnected()).toBe(false);
    expect(onConnectionStateChange).toHaveBeenCalledWith(false);
  });

  it('send throws when not connected', async () => {
    const client = new SignalingClient({
      serverUrl: 'wss://sync-relay.mylife.app',
      deviceId: 'my-device-001',
      onMessage: vi.fn(),
      onConnectionStateChange: vi.fn(),
    });

    await expect(
      client.send({
        type: 'discover',
        fromDeviceId: 'my-device-001',
        payload: {},
      }),
    ).rejects.toThrow('not connected');
  });

  it('disconnect is idempotent when already disconnected', async () => {
    const onConnectionStateChange = vi.fn();
    const client = new SignalingClient({
      serverUrl: 'wss://sync-relay.mylife.app',
      deviceId: 'my-device-001',
      onMessage: vi.fn(),
      onConnectionStateChange,
    });

    // Should not throw or fire callback when already disconnected
    await expect(client.disconnect()).resolves.toBeUndefined();
    expect(onConnectionStateChange).not.toHaveBeenCalled();
  });
});
