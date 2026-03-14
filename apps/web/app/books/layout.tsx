import type { ReactNode } from 'react';
import Link from 'next/link';

const navLinks = [
  { href: '/books', label: 'Library' },
  { href: '/books/search', label: 'Search' },
  { href: '/books/import', label: 'Import' },
  { href: '/books/stats', label: 'Stats' },
  { href: '/books/reader', label: 'Reader' },
];

export default function BooksLayout({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        margin: '-32px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F7F0E7 0%, #FFFDF9 42%, #FFFFFF 100%)',
        color: '#2B1D12',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid rgba(123, 83, 36, 0.14)',
          backgroundColor: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div
          style={{
            margin: '0 auto',
            maxWidth: 1120,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Link
              href="/books"
              style={{
                color: '#8C5A2B',
                fontSize: 30,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              MyBooks
            </Link>
            <p style={{ margin: '6px 0 0', color: '#7A654E', fontSize: 14 }}>
              Track your reading life inside MyLife.
            </p>
          </div>
          <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: '#5D4733',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div style={{ margin: '0 auto', maxWidth: 1120, padding: '32px 24px 48px' }}>
        {children}
      </div>
    </section>
  );
}
