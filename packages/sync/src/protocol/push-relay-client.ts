/**
 * Push notification relay client (Phase 2 stub).
 *
 * In Phase 2, this sends encrypted push notifications via APNs/FCM
 * to wake up sleeping devices for background sync. For now, it's a
 * no-op stub that defines the interface.
 */

export interface PushRelayOptions {
  /** URL of the push relay server. */
  serverUrl: string;
  /** This device's push token (APNs or FCM). */
  deviceToken: string;
  /** This device's public key for identification. */
  deviceId: string;
}

export interface PushNotification {
  /** Target device's push token. */
  targetToken: string;
  /** Encrypted opaque payload (peer can't read it, only wake signal). */
  encryptedPayload: string;
  /** Priority: high for immediate sync, normal for background. */
  priority: 'high' | 'normal';
}

/**
 * Push relay client for background sync triggers.
 *
 * Phase 2: Replace stubs with real HTTP calls to the sync-relay server.
 */
export class PushRelayClient {
  private readonly _serverUrl: string;
  private _registered: boolean = false;

  constructor(options: PushRelayOptions) {
    this._serverUrl = options.serverUrl;
    // Phase 2: Store deviceToken and deviceId for registration
  }

  /** Register this device's push token with the relay server. */
  async register(): Promise<void> {
    // Phase 2: POST /register { deviceId, pushToken, platform }
    this._registered = true;
  }

  /** Send a push notification to wake a peer device. */
  async sendWakeNotification(notification: PushNotification): Promise<void> {
    if (!this._registered) {
      throw new Error('PushRelayClient not registered. Call register() first.');
    }
    // Phase 2: POST /notify { targetToken, encryptedPayload, priority }
    void notification;
  }

  /** Unregister this device from the relay server. */
  async unregister(): Promise<void> {
    // Phase 2: DELETE /register/:deviceId
    this._registered = false;
  }

  /** Check if this client is registered. */
  isRegistered(): boolean {
    return this._registered;
  }

  /** Get the server URL. */
  getServerUrl(): string {
    return this._serverUrl;
  }
}
