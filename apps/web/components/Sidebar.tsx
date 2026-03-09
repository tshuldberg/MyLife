'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModuleRegistry } from '@mylife/module-registry';
import { isWebSupportedModuleId } from '@/lib/modules';
import { MODULE_ICON_MAP } from '@/lib/module-icons';
import { Compass, Settings, Users } from 'lucide-react';

const MODULE_ROUTES: Record<string, string> = {
  books: '/books',
  budget: '/budget',
  car: '/car',
  closet: '/closet',
  cycle: '/cycle',
  fast: '/fast',
  flash: '/flash',
  garden: '/garden',
  habits: '/habits',
  health: '/health',
  homes: '/homes',
  journal: '/journal',
  mail: '/mail',
  meds: '/meds',
  mood: '/mood',
  notes: '/notes',
  nutrition: '/nutrition',
  pets: '/pets',
  recipes: '/recipes',
  rsvp: '/rsvp',
  stars: '/stars',
  subs: '/subs',
  surf: '/surf',
  trails: '/trails',
  voice: '/voice',
  words: '/words',
  workouts: '/workouts',
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
          const IconComponent = MODULE_ICON_MAP[mod.id];
          return (
            <Link
              key={mod.id}
              href={route}
              style={{
                ...styles.moduleLink,
                ...(isActive ? styles.moduleLinkActive : {}),
              }}
            >
              <span style={styles.moduleIcon}>
                {IconComponent && (
                  <IconComponent
                    size={16}
                    style={{ color: `var(--accent-${mod.id})` }}
                  />
                )}
              </span>
              <span
                style={{
                  ...styles.moduleName,
                  color: isActive ? `var(--accent-${mod.id})` : 'var(--text-secondary)',
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
        <span style={styles.bottomLinkContent}>
          <Compass size={16} />
          Discover
        </span>
      </Link>
      <Link
        href="/settings"
        style={{
          ...styles.bottomLink,
          ...(pathname === '/settings' ? { color: 'var(--text)' } : {}),
        }}
      >
        <span style={styles.bottomLinkContent}>
          <Settings size={16} />
          Settings
        </span>
      </Link>
      <Link
        href="/social"
        style={{
          ...styles.bottomLink,
          ...(pathname.startsWith('/social')
            ? { color: 'var(--accent-social)' }
            : {}),
        }}
      >
        <span style={styles.bottomLinkContent}>
          <Users size={16} />
          Social
        </span>
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
    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '18px',
    color: '#0A0A0F',
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
    backgroundColor: 'var(--glass-strong)',
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
    backgroundColor: 'var(--glass)',
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
  bottomLinkContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
