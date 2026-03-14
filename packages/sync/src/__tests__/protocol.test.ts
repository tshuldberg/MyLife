import { describe, it, expect } from 'vitest';
import {
  encodeMessage,
  decodeMessage,
  createSimpleMessage,
  createJsonMessage,
  parseJsonPayload,
} from '../protocol/message-codec';
import { PushRelayClient } from '../protocol/push-relay-client';
import type { PushRelayOptions } from '../protocol/push-relay-client';
import type { SyncMessage, SyncMessageType } from '../types';

// ---------------------------------------------------------------------------
// All SyncMessageType values (must match the types.ts union)
// ---------------------------------------------------------------------------

const ALL_MESSAGE_TYPES: SyncMessageType[] = [
  'HELLO',
  'HELLO_ACK',
  'AUTH_CHALLENGE',
  'AUTH_RESPONSE',
  'SYNC_OFFER',
  'SYNC_ACCEPT',
  'SYNC_DATA',
  'SYNC_ACK',
  'BLOB_REQUEST',
  'BLOB_DATA',
  'BLOB_ACK',
  'BYE',
];

// ---------------------------------------------------------------------------
// encodeMessage / decodeMessage roundtrip
// ---------------------------------------------------------------------------

describe('message codec', () => {
  describe('encodeMessage/decodeMessage roundtrip', () => {
    it('roundtrips a simple message with empty payload', () => {
      const original: SyncMessage = {
        type: 'HELLO',
        deviceId: 'abc123',
        nonce: 'nonce456',
        payload: new Uint8Array(0),
        timestamp: 1710000000000,
      };

      const encoded = encodeMessage(original);
      const decoded = decodeMessage(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.type).toBe('HELLO');
      expect(decoded!.deviceId).toBe('abc123');
      expect(decoded!.nonce).toBe('nonce456');
      expect(decoded!.payload).toEqual(new Uint8Array(0));
      expect(decoded!.timestamp).toBeCloseTo(original.timestamp, -1);
    });

    it('roundtrips a message with binary payload', () => {
      const payload = new Uint8Array([0x01, 0x02, 0x03, 0xFF, 0xFE]);
      const original: SyncMessage = {
        type: 'SYNC_DATA',
        deviceId: 'device-id-hex',
        nonce: 'random-nonce',
        payload,
        timestamp: Date.now(),
      };

      const encoded = encodeMessage(original);
      const decoded = decodeMessage(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.type).toBe('SYNC_DATA');
      expect(decoded!.deviceId).toBe('device-id-hex');
      expect(decoded!.nonce).toBe('random-nonce');
      expect(decoded!.payload).toEqual(payload);
    });

    it('roundtrips all message types', () => {
      for (const type of ALL_MESSAGE_TYPES) {
        const msg: SyncMessage = {
          type,
          deviceId: 'test-device',
          nonce: 'test-nonce',
          payload: new Uint8Array([42]),
          timestamp: 1700000000000,
        };

        const encoded = encodeMessage(msg);
        const decoded = decodeMessage(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded!.type).toBe(type);
      }
    });

    it('roundtrips a message with a long device ID (truncated to 64 bytes)', () => {
      const longId = 'a'.repeat(128);
      const msg: SyncMessage = {
        type: 'BYE',
        deviceId: longId,
        nonce: 'n',
        payload: new Uint8Array(0),
        timestamp: 1000,
      };

      const encoded = encodeMessage(msg);
      const decoded = decodeMessage(encoded);

      expect(decoded).not.toBeNull();
      // Device ID is padded/sliced to 64 bytes, so only first 64 chars survive
      expect(decoded!.deviceId).toBe('a'.repeat(64));
    });
  });

  describe('encodeMessage()', () => {
    it('returns a Uint8Array', () => {
      const msg = createSimpleMessage('HELLO', 'dev1', 'nonce1');
      const encoded = encodeMessage(msg);
      expect(encoded).toBeInstanceOf(Uint8Array);
    });

    it('throws on unknown message type', () => {
      const msg: SyncMessage = {
        type: 'UNKNOWN_TYPE' as SyncMessageType,
        deviceId: 'dev1',
        nonce: 'nonce1',
        payload: new Uint8Array(0),
        timestamp: 0,
      };
      expect(() => encodeMessage(msg)).toThrow('Unknown message type');
    });

    it('includes a 4-byte length prefix', () => {
      const msg = createSimpleMessage('HELLO', 'dev1', 'nonce1');
      const encoded = encodeMessage(msg);
      const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
      const totalLength = view.getUint32(0, false);
      // Total frame = 4 (length prefix) + totalLength
      expect(encoded.length).toBe(4 + totalLength);
    });
  });

  describe('decodeMessage()', () => {
    it('returns null for empty data', () => {
      expect(decodeMessage(new Uint8Array(0))).toBeNull();
    });

    it('returns null for data too short (less than header)', () => {
      expect(decodeMessage(new Uint8Array(10))).toBeNull();
    });

    it('returns null for data with invalid type byte', () => {
      // Build a valid-length buffer but with an invalid type byte
      const msg = createSimpleMessage('HELLO', 'dev1', 'n');
      const encoded = encodeMessage(msg);
      // Corrupt the type byte (offset 4)
      encoded[4] = 0x00; // 0x00 is not in the type map
      expect(decodeMessage(encoded)).toBeNull();
    });

    it('returns null when declared length exceeds actual data', () => {
      const msg = createSimpleMessage('HELLO', 'dev1', 'n');
      const encoded = encodeMessage(msg);
      // Truncate the data so it's shorter than declared
      const truncated = encoded.slice(0, encoded.length - 10);
      // Only returns null if 4 + totalLength > data.length
      // The declared length is still large, but data is truncated
      const view = new DataView(truncated.buffer, truncated.byteOffset, truncated.byteLength);
      const declared = view.getUint32(0, false);
      if (truncated.length < 4 + declared) {
        expect(decodeMessage(truncated)).toBeNull();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// createSimpleMessage
// ---------------------------------------------------------------------------

describe('createSimpleMessage()', () => {
  it('creates a message with the specified type', () => {
    const msg = createSimpleMessage('BYE', 'dev1', 'nonce1');
    expect(msg.type).toBe('BYE');
  });

  it('sets the correct deviceId and nonce', () => {
    const msg = createSimpleMessage('HELLO', 'my-device', 'my-nonce');
    expect(msg.deviceId).toBe('my-device');
    expect(msg.nonce).toBe('my-nonce');
  });

  it('creates an empty payload', () => {
    const msg = createSimpleMessage('HELLO', 'dev1', 'n1');
    expect(msg.payload).toEqual(new Uint8Array(0));
    expect(msg.payload.length).toBe(0);
  });

  it('sets a numeric timestamp', () => {
    const before = Date.now();
    const msg = createSimpleMessage('HELLO_ACK', 'dev1', 'n1');
    const after = Date.now();
    expect(msg.timestamp).toBeGreaterThanOrEqual(before);
    expect(msg.timestamp).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// createJsonMessage / parseJsonPayload
// ---------------------------------------------------------------------------

describe('createJsonMessage()', () => {
  it('encodes a JSON payload into bytes', () => {
    const payload = { key: 'value', count: 42 };
    const msg = createJsonMessage('SYNC_OFFER', 'dev1', 'n1', payload);

    expect(msg.type).toBe('SYNC_OFFER');
    expect(msg.payload.length).toBeGreaterThan(0);

    // Verify the payload is valid JSON when decoded
    const text = new TextDecoder().decode(msg.payload);
    const parsed = JSON.parse(text);
    expect(parsed).toEqual(payload);
  });

  it('encodes arrays correctly', () => {
    const payload = ['books', 'budget', 'recipes'];
    const msg = createJsonMessage('SYNC_ACCEPT', 'dev1', 'n1', payload);
    const parsed = parseJsonPayload<string[]>(msg);
    expect(parsed).toEqual(['books', 'budget', 'recipes']);
  });

  it('encodes nested objects', () => {
    const payload = {
      modules: [{ id: 'books', version: 3 }],
      metadata: { initiator: true },
    };
    const msg = createJsonMessage('SYNC_OFFER', 'dev1', 'n1', payload);
    const parsed = parseJsonPayload<typeof payload>(msg);
    expect(parsed).toEqual(payload);
  });
});

describe('parseJsonPayload()', () => {
  it('returns parsed JSON from a JSON message', () => {
    const data = { hello: 'world' };
    const msg = createJsonMessage('HELLO', 'dev1', 'n1', data);
    const result = parseJsonPayload<{ hello: string }>(msg);
    expect(result).toEqual({ hello: 'world' });
  });

  it('returns null for empty payload', () => {
    const msg = createSimpleMessage('BYE', 'dev1', 'n1');
    expect(parseJsonPayload(msg)).toBeNull();
  });

  it('returns null for invalid JSON payload', () => {
    const msg: SyncMessage = {
      type: 'SYNC_DATA',
      deviceId: 'dev1',
      nonce: 'n1',
      payload: new TextEncoder().encode('not valid json {{{'),
      timestamp: Date.now(),
    };
    expect(parseJsonPayload(msg)).toBeNull();
  });

  it('roundtrips complex data through createJsonMessage + parseJsonPayload', () => {
    const original = {
      deviceId: 'abc',
      nonce: '12345',
      displayName: 'Test Device',
      supportedModules: ['books', 'budget', 'fast'],
      nested: { deep: { value: true } },
    };
    const msg = createJsonMessage('HELLO', 'dev1', 'n1', original);
    const decoded = parseJsonPayload(msg);
    expect(decoded).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// MESSAGE_TYPE_MAP coverage
// ---------------------------------------------------------------------------

describe('MESSAGE_TYPE_MAP coverage', () => {
  it('every SyncMessageType can be encoded without error', () => {
    for (const type of ALL_MESSAGE_TYPES) {
      const msg: SyncMessage = {
        type,
        deviceId: 'dev',
        nonce: 'n',
        payload: new Uint8Array(0),
        timestamp: 0,
      };
      // Should not throw
      expect(() => encodeMessage(msg)).not.toThrow();
    }
  });

  it('every SyncMessageType roundtrips through encode/decode', () => {
    for (const type of ALL_MESSAGE_TYPES) {
      const msg: SyncMessage = {
        type,
        deviceId: 'test-dev',
        nonce: 'test-nonce',
        payload: new Uint8Array([1, 2, 3]),
        timestamp: 1700000000000,
      };
      const decoded = decodeMessage(encodeMessage(msg));
      expect(decoded).not.toBeNull();
      expect(decoded!.type).toBe(type);
    }
  });

  it('covers all 12 message types', () => {
    expect(ALL_MESSAGE_TYPES).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// PushRelayClient
// ---------------------------------------------------------------------------

describe('PushRelayClient', () => {
  const defaultOptions: PushRelayOptions = {
    serverUrl: 'https://relay.mylife.app',
    deviceToken: 'apns-token-123',
    deviceId: 'device-public-key',
  };

  it('starts in unregistered state', () => {
    const client = new PushRelayClient(defaultOptions);
    expect(client.isRegistered()).toBe(false);
  });

  it('reports the configured server URL', () => {
    const client = new PushRelayClient(defaultOptions);
    expect(client.getServerUrl()).toBe('https://relay.mylife.app');
  });

  it('register() sets registered state to true', async () => {
    const client = new PushRelayClient(defaultOptions);
    await client.register();
    expect(client.isRegistered()).toBe(true);
  });

  it('unregister() sets registered state to false', async () => {
    const client = new PushRelayClient(defaultOptions);
    await client.register();
    expect(client.isRegistered()).toBe(true);
    await client.unregister();
    expect(client.isRegistered()).toBe(false);
  });

  it('sendWakeNotification throws when not registered', async () => {
    const client = new PushRelayClient(defaultOptions);
    await expect(
      client.sendWakeNotification({
        targetToken: 'target-token',
        encryptedPayload: 'encrypted-data',
        priority: 'high',
      }),
    ).rejects.toThrow('not registered');
  });

  it('sendWakeNotification does not throw when registered', async () => {
    const client = new PushRelayClient(defaultOptions);
    await client.register();
    await expect(
      client.sendWakeNotification({
        targetToken: 'target-token',
        encryptedPayload: 'encrypted-data',
        priority: 'normal',
      }),
    ).resolves.toBeUndefined();
  });

  it('can re-register after unregister', async () => {
    const client = new PushRelayClient(defaultOptions);
    await client.register();
    await client.unregister();
    await client.register();
    expect(client.isRegistered()).toBe(true);
  });

  it('uses custom server URL', () => {
    const client = new PushRelayClient({
      ...defaultOptions,
      serverUrl: 'https://custom-relay.example.com',
    });
    expect(client.getServerUrl()).toBe('https://custom-relay.example.com');
  });
});

// ---------------------------------------------------------------------------
// Handshake error cases (unit-level, no crypto mocking needed)
// ---------------------------------------------------------------------------

describe('handshake protocol', () => {
  // The handshake functions require crypto, identity module, and real connections.
  // We test the exported types and structure without fully mocking the crypto layer.
  // For unit-level coverage, we verify the module can be imported and has the
  // expected exports.

  it('handshake module exports initiatorHandshake and responderHandshake', async () => {
    const handshakeModule = await import('../protocol/handshake');
    expect(typeof handshakeModule.initiatorHandshake).toBe('function');
    expect(typeof handshakeModule.responderHandshake).toBe('function');
  });
});
