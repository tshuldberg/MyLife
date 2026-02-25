'use client';

import {
  useModuleRegistry,
  useEnabledModules,
  type ModuleId,
} from '@mylife/module-registry';
import { enableModuleAction, disableModuleAction } from '../actions';
import { WEB_SUPPORTED_MODULE_IDS } from '@/lib/modules';
import { MODULE_METADATA } from '@mylife/module-registry';

export default function DiscoverPage() {
  const registry = useModuleRegistry();
  // Subscribe to registry changes for re-rendering
  useEnabledModules();

  const allModules = WEB_SUPPORTED_MODULE_IDS.map((id) => MODULE_METADATA[id]);

  const handleToggle = async (id: ModuleId) => {
    if (registry.isEnabled(id)) {
      await disableModuleAction(id);
      registry.disable(id);
    } else {
      await enableModuleAction(id);
      registry.enable(id);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Discover</h1>
        <p style={styles.subtitle}>Browse all {allModules.length} modules</p>
      </div>

      <div style={styles.grid}>
        {allModules.map((mod) => {
          const isEnabled = registry.isEnabled(mod.id);
          return (
            <div key={mod.id} style={styles.card}>
              <div
                style={{
                  ...styles.accentBorder,
                  backgroundColor: mod.accentColor,
                }}
              />
              <div style={styles.content}>
                <div style={styles.cardHeader}>
                  <span style={styles.icon}>{mod.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.name}>{mod.name}</h3>
                    <p style={styles.tagline}>{mod.tagline}</p>
                  </div>
                  <button
                    onClick={() => void handleToggle(mod.id)}
                    style={{
                      ...styles.toggleButton,
                      backgroundColor: isEnabled
                        ? mod.accentColor
                        : 'transparent',
                      borderColor: isEnabled
                        ? mod.accentColor
                        : 'var(--border)',
                      color: isEnabled ? '#0E0C09' : 'var(--text-secondary)',
                    }}
                  >
                    {isEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
                <div style={styles.meta}>
                  <span
                    style={{
                      ...styles.tierBadge,
                      color:
                        mod.tier === 'free'
                          ? 'var(--success)'
                          : 'var(--text-tertiary)',
                    }}
                  >
                    {mod.tier === 'free' ? 'Free' : 'Premium'}
                  </span>
                  <span style={styles.metaText}>
                    {mod.storageType === 'sqlite'
                      ? 'Local'
                      : mod.storageType === 'supabase'
                        ? 'Cloud'
                        : 'Cloud'}
                  </span>
                  {mod.requiresNetwork && (
                    <span style={styles.metaText}>Requires network</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  accentBorder: {
    width: '4px',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  name: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  tagline: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
    marginTop: '2px',
  },
  toggleButton: {
    padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tierBadge: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metaText: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
};
