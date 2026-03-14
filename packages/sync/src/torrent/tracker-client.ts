/**
 * Tracker client: announce, get-peers, and scrape.
 *
 * Communicates with the MyLife tracker server to coordinate P2P swarms
 * for content distribution. The tracker knows which peers have which
 * content but never sees the content itself.
 */

export interface AnnounceParams {
  infoHash: string;
  peerId: string;
  event: 'started' | 'stopped' | 'completed';
  uploaded: number;
  downloaded: number;
  left: number;
  port: number;
  connectionInfo?: string;
}

export interface TrackerPeer {
  peerId: string;
  connectionInfo: string;
  isSeeder: boolean;
}

export interface ScrapeResult {
  seeders: number;
  leechers: number;
  completed: number;
}

export interface TrackerClientOptions {
  trackerUrl: string;
  peerId: string;
}

/**
 * Client for the MyLife content tracker.
 *
 * Phase 2+: Replace stubs with real WebSocket/HTTP calls to the tracker server.
 */
export class TrackerClient {
  private readonly _trackerUrl: string;
  private readonly _peerId: string;
  private _connected: boolean = false;

  constructor(options: TrackerClientOptions) {
    this._trackerUrl = options.trackerUrl;
    this._peerId = options.peerId;
  }

  /** Connect to the tracker server. */
  async connect(): Promise<void> {
    // Phase 2: Establish WebSocket connection to tracker
    this._connected = true;
  }

  /** Announce presence for a torrent. */
  async announce(params: AnnounceParams): Promise<TrackerPeer[]> {
    this._assertConnected();
    // Phase 2: Send announce to tracker, receive peer list
    void params;
    return [];
  }

  /** Get peers for a specific torrent. */
  async getPeers(infoHash: string): Promise<TrackerPeer[]> {
    this._assertConnected();
    // Phase 2: GET /peers/:infoHash
    void infoHash;
    return [];
  }

  /** Get swarm statistics for a torrent. */
  async scrape(infoHash: string): Promise<ScrapeResult> {
    this._assertConnected();
    // Phase 2: GET /scrape/:infoHash
    void infoHash;
    return { seeders: 0, leechers: 0, completed: 0 };
  }

  /** Check if connected to the tracker. */
  isConnected(): boolean {
    return this._connected;
  }

  /** Get the tracker URL. */
  getTrackerUrl(): string {
    return this._trackerUrl;
  }

  /** Disconnect from the tracker. */
  async disconnect(): Promise<void> {
    // Phase 2: Close WebSocket connection
    this._connected = false;
  }

  private _assertConnected(): void {
    if (!this._connected) throw new Error('TrackerClient not connected');
  }
}
