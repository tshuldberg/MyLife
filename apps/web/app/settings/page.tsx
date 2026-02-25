'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useModuleRegistry } from '@mylife/module-registry';
import type { Entitlements, PlanMode } from '@mylife/entitlements';
import {
  getModeConfigAction,
  getStoredEntitlementAction,
  refreshStoredEntitlementAction,
} from '../actions';
import { isWebSupportedModuleId } from '@/lib/modules';

export default function SettingsPage() {
  const registry = useModuleRegistry();
  const enabled = registry
    .getEnabled()
    .filter((mod) => isWebSupportedModuleId(mod.id));
  const [mode, setMode] = useState<PlanMode>('local_only');
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlements | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadModeAndEntitlement = async () => {
    const [modeConfig, storedEntitlement] = await Promise.all([
      getModeConfigAction(),
      getStoredEntitlementAction(),
    ]);
    setMode(modeConfig.mode);
    setServerUrl(modeConfig.serverUrl);
    setEntitlement(storedEntitlement);
  };

  useEffect(() => {
    void loadModeAndEntitlement();
  }, []);

  const handleRefreshEntitlement = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshStoredEntitlementAction();
      setRefreshMessage(result.message);
      if (result.ok) {
        await loadModeAndEntitlement();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Manage your MyLife hub</p>
      </div>

      {/* Subscription status */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Subscription</h2>
        <div style={styles.card}>
          <div style={styles.row}>
            <div>
              <p style={styles.planLabel}>Current Plan</p>
              <p style={styles.planValue}>Free Tier</p>
            </div>
            <Link href="/discover" style={styles.upgradeButton}>
              Upgrade
            </Link>
          </div>
          <p style={styles.planNote}>
            Free tier includes {registry.getAll().filter((m) => m.tier === 'free').length} modules.
            Upgrade to unlock all {registry.size} modules.
          </p>
        </div>
      </section>

      {/* Active modules summary */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Active Modules</h2>
        <div style={styles.card}>
          {enabled.length > 0 ? (
            <div style={styles.moduleList}>
              {enabled.map((mod) => (
                <div key={mod.id} style={styles.moduleRow}>
                  <span style={styles.moduleIcon}>{mod.icon}</span>
                  <span style={styles.moduleName}>{mod.name}</span>
                  <span style={styles.moduleVersion}>v{mod.version}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No modules enabled</p>
          )}
        </div>
      </section>

      {/* Data & Privacy */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Data &amp; Privacy</h2>
        <div style={styles.card}>
          <p style={styles.privacyText}>
            All your data is stored locally on this device. MyLife does not
            collect analytics, telemetry, or crash reports. Modules using cloud
            storage (Supabase) sync only with your authenticated account.
          </p>
        </div>
      </section>

      {/* Runtime Mode */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Mode</h2>
        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.planLabel}>Current Mode</span>
            <span style={styles.modeBadge}>{mode.replace('_', ' ').toUpperCase()}</span>
          </div>
          {serverUrl && (
            <p style={styles.planNote}>
              Server: {serverUrl}
            </p>
          )}
          <a href="/settings/self-host" style={styles.linkButton}>
            Open Self-Host Setup
          </a>
        </div>
      </section>

      {/* Entitlements */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Entitlements</h2>
        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.planLabel}>Sync</span>
            <button
              style={styles.refreshButton}
              onClick={() => void handleRefreshEntitlement()}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {refreshMessage && (
            <p style={styles.planNote}>{refreshMessage}</p>
          )}
          {entitlement ? (
            <>
              <div style={styles.row}>
                <span style={styles.planLabel}>Hosted</span>
                <span style={styles.planValue}>{entitlement.hostedActive ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.planLabel}>Self-host</span>
                <span style={styles.planValue}>{entitlement.selfHostLicense ? 'LICENSED' : 'NO LICENSE'}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.planLabel}>Update Pack</span>
                <span style={styles.planValue}>{entitlement.updatePackYear ?? 'None'}</span>
              </div>
            </>
          ) : (
            <p style={styles.emptyText}>No entitlement cached</p>
          )}
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '12px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '20px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  planLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: 0,
  },
  planValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
    marginTop: '4px',
  },
  upgradeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--accent-books)',
    backgroundColor: 'transparent',
    color: 'var(--accent-books)',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  planNote: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  modeBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text)',
    backgroundColor: 'var(--surface-elevated)',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
  },
  refreshButton: {
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    borderRadius: 'var(--radius-md)',
    padding: '6px 10px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  linkButton: {
    display: 'inline-block',
    marginTop: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 10px',
    fontWeight: 600,
    fontSize: '13px',
    textDecoration: 'none',
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  moduleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  moduleIcon: {
    fontSize: '20px',
  },
  moduleName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    flex: 1,
  },
  moduleVersion: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  privacyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    margin: 0,
  },
};
