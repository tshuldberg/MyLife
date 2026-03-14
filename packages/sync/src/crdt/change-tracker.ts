/**
 * Intercepts SQLite writes and records them to the sync change log.
 *
 * The tracker maps table names to owning modules using prefix matching,
 * generates unique IDs for each change record, and persists them via
 * the database adapter.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type { ChangeRecord } from '../types';
import {
  insertChangeRecord,
  getUnsyncedChanges,
  getUnsyncedChangesByModule,
  markChangesSynced,
} from '../db/queries';

export interface ChangeTrackerOptions {
  db: DatabaseAdapter;
  deviceId: string;
  /** Module ID to table prefix mapping (e.g., { books: 'bk_', budget: 'bg_' }) */
  modulePrefixes: Map<string, string>;
  /** Callback when a change is recorded */
  onChangeRecorded?: (record: ChangeRecord) => void;
}

/** Generate a simple ULID-like ID from timestamp + random suffix. */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Tracks SQLite write operations and records them as ChangeRecords
 * for outbound sync. Call recordChange() after every INSERT/UPDATE/DELETE.
 */
export class ChangeTracker {
  private db: DatabaseAdapter;
  private deviceId: string;
  private modulePrefixes: Map<string, string>;
  private onChangeRecorded?: (record: ChangeRecord) => void;

  constructor(options: ChangeTrackerOptions) {
    this.db = options.db;
    this.deviceId = options.deviceId;
    this.modulePrefixes = options.modulePrefixes;
    this.onChangeRecorded = options.onChangeRecorded;
  }

  /**
   * Record a change that was made to SQLite.
   * Call this after every INSERT/UPDATE/DELETE.
   */
  recordChange(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    rowId: string,
    data: Record<string, unknown> | null,
  ): void {
    const moduleId = this.resolveModule(table);
    if (!moduleId) {
      return; // Unknown table prefix, skip silently
    }

    const record: ChangeRecord = {
      id: generateId(),
      moduleId,
      tableName: table,
      operation,
      rowId,
      dataJson: data ? JSON.stringify(data) : null,
      deviceId: this.deviceId,
      timestamp: Date.now(),
      synced: false,
      createdAt: new Date().toISOString(),
    };

    insertChangeRecord(this.db, record);

    if (this.onChangeRecorded) {
      this.onChangeRecorded(record);
    }
  }

  /**
   * Resolve which module owns a table by its prefix.
   * Matches the longest prefix first to avoid ambiguity.
   */
  resolveModule(tableName: string): string | null {
    let bestMatch: string | null = null;
    let bestPrefixLength = 0;

    for (const [moduleId, prefix] of this.modulePrefixes) {
      if (tableName.startsWith(prefix) && prefix.length > bestPrefixLength) {
        bestMatch = moduleId;
        bestPrefixLength = prefix.length;
      }
    }

    return bestMatch;
  }

  /** Get unsynced changes. */
  getUnsynced(limit?: number): ChangeRecord[] {
    return getUnsyncedChanges(this.db, limit);
  }

  /** Get unsynced changes for a specific module. */
  getUnsyncedByModule(moduleId: string, limit?: number): ChangeRecord[] {
    return getUnsyncedChangesByModule(this.db, moduleId, limit);
  }

  /** Mark changes as synced. */
  markSynced(ids: string[]): void {
    markChangesSynced(this.db, ids);
  }

  /** Get total pending change count. */
  getPendingCount(): number {
    const rows = this.db.query<{ c: number }>(
      'SELECT COUNT(*) as c FROM sync_change_log WHERE synced = 0',
    );
    return rows[0]?.c ?? 0;
  }
}
