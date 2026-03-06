/**
 * Database integration for the sync layer.
 *
 * Provides functions to wire a SyncProvider into the DB initialization
 * flow and handle tier transitions gracefully.
 */

import type { SyncProvider, SyncTier } from './types';
import { tierRequiresAuth, isCloudTier } from './types';
import { LocalOnlyProvider } from './providers/local-only';
import type { LocalOnlyProviderOptions } from './providers/local-only';
import type { P2PProviderOptions } from './providers/p2p';
import { P2PProvider } from './providers/p2p';
import type { CloudProviderOptions } from './providers/cloud';
import { CloudProvider } from './providers/cloud';
import { setSyncProvider } from './hooks';

export interface SyncManagerOptions {
  /** Options for creating the LocalOnlyProvider. */
  localOnlyOptions?: LocalOnlyProviderOptions;
  /** Factory for creating a P2PProvider (requires platform-specific WebRTC). */
  createP2PProvider?: (baseOptions: Omit<P2PProviderOptions, 'deviceId'> & { deviceId: string }) => P2PProvider;
  /** Factory for creating a CloudProvider (requires PowerSync + Supabase). */
  createCloudProvider?: (tier: CloudProviderOptions['tier']) => CloudProvider;
  /** Called to check if the user is authenticated. */
  isAuthenticated?: () => Promise<boolean>;
}

/**
 * Manages sync provider lifecycle and tier transitions.
 */
export class SyncManager {
  private _currentProvider: SyncProvider | null = null;
  private _currentTier: SyncTier = 'local_only';
  private readonly _options: SyncManagerOptions;

  constructor(options: SyncManagerOptions = {}) {
    this._options = options;
  }

  /** The currently active sync provider. */
  get provider(): SyncProvider | null {
    return this._currentProvider;
  }

  /** The current sync tier. */
  get tier(): SyncTier {
    return this._currentTier;
  }

  /**
   * Initialize with the given tier.
   * Creates the appropriate provider, initializes it, and sets it as active.
   */
  async initialize(tier: SyncTier = 'local_only'): Promise<SyncProvider> {
    const provider = await this._createProvider(tier);
    await provider.initialize();

    this._currentProvider = provider;
    this._currentTier = tier;
    setSyncProvider(provider);

    return provider;
  }

  /**
   * Switch to a new sync tier.
   *
   * Handles transitions:
   * - local -> p2p: create P2P provider, start pairing flow
   * - local -> cloud: push local data to cloud, start sync
   * - cloud -> local: stop sync, keep local data
   * - p2p -> cloud: disconnect peers, start cloud sync
   */
  async switchTier(newTier: SyncTier): Promise<SyncProvider> {
    if (newTier === this._currentTier && this._currentProvider) {
      return this._currentProvider;
    }

    // Verify auth for cloud tiers
    if (tierRequiresAuth(newTier)) {
      const isAuth = await this._options.isAuthenticated?.();
      if (!isAuth) {
        throw new Error(
          `Tier "${newTier}" requires authentication. Please sign in first.`,
        );
      }
    }

    // Tear down old provider
    if (this._currentProvider) {
      await this._currentProvider.destroy();
    }

    // Create and initialize new provider
    const provider = await this._createProvider(newTier);
    await provider.initialize();

    this._currentProvider = provider;
    this._currentTier = newTier;
    setSyncProvider(provider);

    return provider;
  }

  /**
   * Tear down the current provider and release resources.
   */
  async destroy(): Promise<void> {
    if (this._currentProvider) {
      await this._currentProvider.destroy();
      this._currentProvider = null;
    }
    this._currentTier = 'local_only';
    setSyncProvider(null);
  }

  private async _createProvider(tier: SyncTier): Promise<SyncProvider> {
    switch (tier) {
      case 'local_only':
        return new LocalOnlyProvider(this._options.localOnlyOptions);

      case 'p2p': {
        if (!this._options.createP2PProvider) {
          throw new Error(
            'P2P sync is not available. No createP2PProvider factory was provided.',
          );
        }
        // The caller provides the full P2PProviderOptions via factory
        return this._options.createP2PProvider({
          deviceId: '',
          createPeerConnection: () => { throw new Error('Not configured'); },
          signalingTransport: { send: async () => {}, onMessage: () => () => {} },
          getOutboundChangeset: async () => ({ id: '', sourceDeviceId: '', createdAt: '', changes: [] }),
          onInboundChangeset: async () => {},
        });
      }

      case 'free_cloud':
      case 'starter_cloud':
      case 'power_cloud': {
        if (!this._options.createCloudProvider) {
          throw new Error(
            'Cloud sync is not available. No createCloudProvider factory was provided.',
          );
        }
        return this._options.createCloudProvider(tier);
      }

      default: {
        const _exhaustive: never = tier;
        throw new Error(`Unknown sync tier: ${_exhaustive}`);
      }
    }
  }
}

/**
 * Create a SyncManager with default options suitable for local-only mode.
 * Additional providers can be configured later.
 */
export function createSyncManager(options?: SyncManagerOptions): SyncManager {
  return new SyncManager(options);
}
