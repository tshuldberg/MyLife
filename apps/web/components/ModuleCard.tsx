'use client';

import Link from 'next/link';
import type { ModuleDefinition } from '@mylife/module-registry';

interface ModuleCardProps {
  module: ModuleDefinition;
  enabled: boolean;
}

export function ModuleCard({ module, enabled }: ModuleCardProps) {
  const route = `/${module.id}`;

  return (
    <Link href={route} style={styles.card}>
      <div
        style={{
          ...styles.accentBorder,
          backgroundColor: module.accentColor,
        }}
      />
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.icon}>{module.icon}</span>
          <div>
            <h3 style={styles.name}>{module.name}</h3>
            <p style={styles.tagline}>{module.tagline}</p>
          </div>
        </div>
        <div style={styles.footer}>
          <span
            style={{
              ...styles.badge,
              color: enabled ? 'var(--success)' : 'var(--text-tertiary)',
              borderColor: enabled ? 'var(--success)' : 'var(--border)',
            }}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <span
            style={{
              ...styles.tierBadge,
              color: module.tier === 'free' ? 'var(--success)' : module.accentColor,
            }}
          >
            {module.tier === 'free' ? 'Free' : 'Premium'}
          </span>
        </div>
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    textDecoration: 'none',
    transition: 'background-color 0.15s, border-color 0.15s',
    cursor: 'pointer',
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
  header: {
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
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
  },
  tierBadge: {
    fontSize: '12px',
    fontWeight: 500,
  },
};
