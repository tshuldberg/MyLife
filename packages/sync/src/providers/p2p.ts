/**
 * P2PProvider -- Device-to-device sync via WebRTC.
 *
 * Uses WebRTC data channels to transfer changesets between devices.
 * Does NOT require Supabase auth. Pairing is done via 6-digit codes.
 *
 * Signaling (SDP/ICE exchange) is delegated to an injected SignalingTransport.
 */

import type {
  SyncProvider,
  SyncStatus,
  SyncEventListener,
  SyncEvent,
} from '../types';
import type { Changeset } from '../changeset';
import type { WebRTCManager, RTCPeerConnectionLike, SDPDescription, ICECandidate } from '../signaling/webrtc';
import { WebRTCManager as WebRTCManagerImpl } from '../signaling/webrtc';
import { createPairingSession, isValidPairingCode, isPairingSessionExpired } from '../signaling/pairing';
import type { PairingSession } from '../signaling/pairing';

/**
 * Transport for signaling messages (SDP offers/answers and ICE candidates).
 * Implementations could use Supabase Realtime, a WebSocket server,
 * manual copy-paste, or any other mechanism.
 */
export interface SignalingTransport {
  /** Send a signaling message to a peer identified by pairing code. */
  send(pairingCode: string, message: SignalingMessage): Promise<void>;
  /** Register handler for incoming signaling messages. Returns unsubscribe. */
  onMessage(pairingCode: string, handler: (message: SignalingMessage) => void): () => void;
}

export type SignalingMessage =
  | { type: 'offer'; sdp: SDPDescription }
  | { type: 'answer'; sdp: SDPDescription }
  | { type: 'ice-candidate'; candidate: ICECandidate }
  | { type: 'changeset'; data: Changeset };

export interface P2PProviderOptions {
  /** Unique identifier for this device. */
  deviceId: string;
  /** Factory to create platform-specific RTCPeerConnection. */
  createPeerConnection: () => RTCPeerConnectionLike;
  /** Transport for exchanging signaling messages. */
  signalingTransport: SignalingTransport;
  /** Called to get the changeset to send to the peer. */
  getOutboundChangeset: () => Promise<Changeset>;
  /** Called when a changeset is received from the peer. */
  onInboundChangeset: (changeset: Changeset) => Promise<void>;
}

export class P2PProvider implements SyncProvider {
  readonly tier = 'p2p' as const;

  private _webrtc: WebRTCManager | null = null;
  private _pairingSession: PairingSession | null = null;
  private _listeners: Set<SyncEventListener> = new Set();
  private _signalingUnsubscribe: (() => void) | null = null;
  private _connected = false;
  private _paused = false;
  private _lastSyncedAt: Date | null = null;
  private _pendingChanges = 0;
  private _peerId: string | null = null;
  private readonly _options: P2PProviderOptions;

  constructor(options: P2PProviderOptions) {
    this._options = options;
  }

  async initialize(): Promise<void> {
    // P2P doesn't auto-connect on init; pairing must be initiated explicitly
  }

  /**
   * Start a pairing session. Returns the 6-digit code for the remote device.
   */
  startPairing(): PairingSession {
    this._pairingSession = createPairingSession(this._options.deviceId);
    this._setupSignaling(this._pairingSession.code);
    return this._pairingSession;
  }

  /**
   * Join a pairing session using a code from another device.
   */
  async joinPairing(code: string): Promise<void> {
    if (!isValidPairingCode(code)) {
      throw new Error('Invalid pairing code. Must be 6 digits.');
    }

    this._setupSignaling(code);
    this._createWebRTCManager();

    const offer = await this._webrtc!.createOffer();
    await this._options.signalingTransport.send(code, { type: 'offer', sdp: offer });
  }

  async sync(): Promise<void> {
    if (!this._connected || this._paused || !this._webrtc) return;

    const changeset = await this._options.getOutboundChangeset();
    if (changeset.changes.length === 0) return;

    this._webrtc.send(JSON.stringify({ type: 'changeset', data: changeset } satisfies SignalingMessage));
    this._lastSyncedAt = new Date();
    this._emit({ type: 'sync_complete', timestamp: this._lastSyncedAt });
  }

  async pause(): Promise<void> {
    this._paused = true;
  }

  async resume(): Promise<void> {
    this._paused = false;
  }

  getStatus(): SyncStatus {
    return {
      tier: 'p2p',
      connected: this._connected,
      lastSyncedAt: this._lastSyncedAt,
      storageUsedBytes: 0,
      storageLimitBytes: Infinity,
      pendingChanges: this._pendingChanges,
    };
  }

  async getStorageUsed(): Promise<number> {
    return 0;
  }

  onEvent(listener: SyncEventListener): () => void {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  async destroy(): Promise<void> {
    this._signalingUnsubscribe?.();
    this._signalingUnsubscribe = null;
    this._webrtc?.close();
    this._webrtc = null;
    this._connected = false;
    this._pairingSession = null;
    this._listeners.clear();
  }

  /** Whether we have an active peer connection. */
  get connected(): boolean {
    return this._connected;
  }

  /** The current pairing session, if any. */
  get pairingSession(): PairingSession | null {
    return this._pairingSession;
  }

  private _createWebRTCManager(): void {
    this._webrtc = new WebRTCManagerImpl({
      createPeerConnection: this._options.createPeerConnection,
      onIceCandidate: (candidate) => {
        const code = this._pairingSession?.code;
        if (code) {
          void this._options.signalingTransport.send(code, {
            type: 'ice-candidate',
            candidate,
          });
        }
      },
      onConnected: () => {
        this._connected = true;
        const peerId = this._peerId ?? 'unknown';
        this._emit({ type: 'peer_connected', peerId });
        this._emit({ type: 'status_change', status: this.getStatus() });
      },
      onDisconnected: () => {
        this._connected = false;
        const peerId = this._peerId ?? 'unknown';
        this._emit({ type: 'peer_disconnected', peerId });
        this._emit({ type: 'status_change', status: this.getStatus() });
      },
      onMessage: (data) => {
        void this._handleIncomingMessage(data);
      },
    });
  }

  private _setupSignaling(code: string): void {
    this._signalingUnsubscribe?.();
    this._signalingUnsubscribe = this._options.signalingTransport.onMessage(
      code,
      (message) => { void this._handleSignalingMessage(message); },
    );
  }

  private async _handleSignalingMessage(message: SignalingMessage): Promise<void> {
    switch (message.type) {
      case 'offer': {
        // We are the responder: accept offer and send answer
        if (!this._webrtc) this._createWebRTCManager();
        const answer = await this._webrtc!.acceptOffer(message.sdp);
        const code = this._pairingSession?.code;
        if (code) {
          await this._options.signalingTransport.send(code, { type: 'answer', sdp: answer });
        }
        break;
      }
      case 'answer': {
        await this._webrtc?.acceptAnswer(message.sdp);
        break;
      }
      case 'ice-candidate': {
        await this._webrtc?.addIceCandidate(message.candidate);
        break;
      }
      case 'changeset': {
        await this._options.onInboundChangeset(message.data);
        this._lastSyncedAt = new Date();
        this._emit({ type: 'sync_complete', timestamp: this._lastSyncedAt });
        break;
      }
    }
  }

  private async _handleIncomingMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data) as SignalingMessage;
      if (message.type === 'changeset') {
        await this._options.onInboundChangeset(message.data);
        this._lastSyncedAt = new Date();
        this._emit({ type: 'sync_complete', timestamp: this._lastSyncedAt });
      }
    } catch (err) {
      this._emit({
        type: 'sync_error',
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  private _emit(event: SyncEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }
}
