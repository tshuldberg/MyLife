/**
 * WebSocket client for the signaling server.
 *
 * Phase 2: Replace with real WebSocket connection to sync-relay server.
 *
 * This is a stub implementation that defines the interface for the
 * signaling client. When the sync-relay server is built, this module
 * will manage a persistent WebSocket connection for WebRTC offer/answer
 * exchange, ICE candidate relay, and peer presence notifications.
 */

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'discover' | 'notify';
  fromDeviceId: string;
  toDeviceId?: string;
  payload: unknown;
}

export interface SignalingClientOptions {
  /** URL of the signaling server (e.g. wss://sync-relay.mylife.app). */
  serverUrl: string;
  /** This device's public key / identifier. */
  deviceId: string;
  /** Called when a message is received from the signaling server. */
  onMessage: (message: SignalingMessage) => void;
  /** Called when the connection state to the server changes. */
  onConnectionStateChange: (connected: boolean) => void;
}

/**
 * Signaling client stub for WAN peer discovery and WebRTC negotiation.
 *
 * Phase 2: Replace with real WebSocket connection to sync-relay server.
 *
 * All methods are safe to call but perform no real I/O. They log
 * operations for debugging and resolve immediately.
 */
export class SignalingClient {
  private readonly _options: SignalingClientOptions;
  private _connected = false;

  constructor(options: SignalingClientOptions) {
    this._options = options;
  }

  /**
   * Connect to the signaling server.
   *
   * Phase 2: Replace with real WebSocket connection to sync-relay server.
   * Stub: resolves immediately without connecting.
   */
  async connect(): Promise<void> {
    // Phase 2: Replace with real WebSocket connection to sync-relay server
    // e.g. this._ws = new WebSocket(this._options.serverUrl);
    this._connected = true;
    this._options.onConnectionStateChange(true);
  }

  /**
   * Send a message through the signaling server.
   *
   * Phase 2: Replace with real WebSocket connection to sync-relay server.
   * Stub: resolves immediately without sending.
   */
  async send(_message: SignalingMessage): Promise<void> {
    if (!this._connected) {
      throw new Error('SignalingClient is not connected.');
    }
    // Phase 2: Replace with real WebSocket connection to sync-relay server
    // e.g. this._ws.send(JSON.stringify(message));
  }

  /** Check if connected to the signaling server. */
  isConnected(): boolean {
    return this._connected;
  }

  /**
   * Disconnect from the signaling server.
   *
   * Phase 2: Replace with real WebSocket connection to sync-relay server.
   * Stub: resolves immediately.
   */
  async disconnect(): Promise<void> {
    if (!this._connected) return;
    // Phase 2: Replace with real WebSocket connection to sync-relay server
    // e.g. this._ws.close();
    this._connected = false;
    this._options.onConnectionStateChange(false);
  }
}
