import Link from 'next/link';

export default function BooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav style={styles.breadcrumb}>
        <Link href="/" style={styles.breadcrumbLink}>
          Dashboard
        </Link>
        <span style={styles.breadcrumbSep}>/</span>
        <span style={styles.breadcrumbCurrent}>MyBooks</span>
      </nav>
      <div style={styles.subnav}>
        <Link href="/books" style={styles.subnavLink}>
          Library
        </Link>
        <Link href="/books/search" style={styles.subnavLink}>
          Search
        </Link>
        <Link href="/books/reader" style={styles.subnavLink}>
          Reader
        </Link>
        <Link href="/books/stats" style={styles.subnavLink}>
          Stats
        </Link>
        <Link href="/books/import" style={styles.subnavLink}>
          Import
        </Link>
      </div>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '13px',
  },
  breadcrumbLink: {
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  breadcrumbSep: {
    color: 'var(--text-tertiary)',
  },
  breadcrumbCurrent: {
    color: 'var(--accent-books)',
    fontWeight: 500,
  },
  subnav: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
  },
  subnavLink: {
    padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'background-color 0.15s, color 0.15s',
  },
};
