'use client';

import { useEnabledModules } from '@mylife/module-registry';
import { ModuleCard } from '@/components/ModuleCard';
import Link from 'next/link';
import { isWebSupportedModuleId } from '@/lib/modules';

export default function HubDashboard() {
  const enabled = useEnabledModules().filter((mod) => isWebSupportedModuleId(mod.id));

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          {enabled.length} module{enabled.length !== 1 ? 's' : ''} active
        </p>
      </div>

      {enabled.length > 0 ? (
        <div style={styles.grid}>
          {enabled.map((mod) => (
            <ModuleCard key={mod.id} module={mod} enabled={true} />
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No modules enabled yet</p>
          <p style={styles.emptyText}>
            Head to{' '}
            <Link href="/discover" style={styles.link}>
              Discover
            </Link>{' '}
            to browse and enable modules.
          </p>
        </div>
      )}
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '64px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  link: {
    color: 'var(--accent-books)',
    textDecoration: 'underline',
  },
};
