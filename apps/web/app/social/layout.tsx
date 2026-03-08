'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/social', label: 'Feed' },
  { href: '/social/friends', label: 'Friends' },
  { href: '/social/challenges', label: 'Challenges' },
  { href: '/social/groups', label: 'Groups' },
  { href: '/social/leaderboard', label: 'Leaderboard' },
  { href: '/social/profile', label: 'Profile' },
];

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Social</h1>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/social'
                ? pathname === '/social'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...styles.navLink,
                  color: isActive
                    ? 'var(--accent-social)'
                    : 'var(--text-tertiary)',
                  borderBottomColor: isActive
                    ? 'var(--accent-social)'
                    : 'transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
    marginBottom: '16px',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid var(--border)',
    overflowX: 'auto',
  },
  navLink: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    borderBottom: '2px solid',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  },
  content: {
    marginTop: '24px',
  },
};
