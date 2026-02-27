'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModuleRegistry } from '@mylife/module-registry';
import { isWebSupportedModuleId } from '@/lib/modules';

const MODULE_ROUTES: Record<string, string> = {
  books: '/books',
  budget: '/budget',
  fast: '/fast',
  recipes: '/recipes',
  rsvp: '/rsvp',
  surf: '/surf',
  workouts: '/workouts',
  homes: '/homes',
  car: '/car',
  habits: '/habits',
  meds: '/meds',
  words: '/words',
};

export function Sidebar() {
  const pathname = usePathname();
  const registry = useModuleRegistry();
  const enabled = registry.getEnabled().filter((mod) => isWebSupportedModuleId(mod.id));

  return (
    <nav style={styles.sidebar}>
      {/* Logo */}
      <Link href="/" style={styles.logo}>
        <span style={styles.logoIcon}>M</span>
        <span style={styles.logoText}>MyLife</span>
      </Link>

      <div style={styles.divider} />

      {/* Enabled module links */}
      <div style={styles.moduleList}>
        {enabled.map((mod) => {
          const route = MODULE_ROUTES[mod.id] ?? `/${mod.id}`;
          const isActive = pathname.startsWith(route);
          return (
            <Link
              key={mod.id}
              href={route}
              style={{
                ...styles.moduleLink,
                ...(isActive ? styles.moduleLinkActive : {}),
              }}
            >
              <span
                style={{
                  ...styles.moduleIcon,
                  backgroundColor: `${mod.accentColor}1A`,
                }}
              >
                {mod.icon}
              </span>
              <span
                style={{
                  ...styles.moduleName,
                  color: isActive ? mod.accentColor : 'var(--text-secondary)',
                }}
              >
                {mod.name}
              </span>
            </Link>
          );
        })}

        {enabled.length === 0 && (
          <p style={styles.emptyText}>No modules enabled</p>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <div style={styles.divider} />

      {/* Bottom links */}
      <Link
        href="/discover"
        style={{
          ...styles.bottomLink,
          ...(pathname === '/discover' ? { color: 'var(--text)' } : {}),
        }}
      >
        Discover
      </Link>
      <Link
        href="/settings"
        style={{
          ...styles.bottomLink,
          ...(pathname === '/settings' ? { color: 'var(--text)' } : {}),
        }}
      >
        Settings
      </Link>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    overflow: 'hidden',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 20px',
    marginBottom: '8px',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #C9894D, #F97316)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '18px',
    color: '#0E0C09',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '12px 20px',
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'auto',
  },
  moduleLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 20px',
    borderRadius: '0',
    textDecoration: 'none',
    transition: 'background-color 0.15s',
  },
  moduleLinkActive: {
    backgroundColor: 'var(--surface-elevated)',
  },
  moduleIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  moduleName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'color 0.15s',
  },
  emptyText: {
    padding: '8px 20px',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  bottomLink: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
};
