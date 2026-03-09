import Link from 'next/link';
import { searchJournalEntries } from '@mylife/journal';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-journal)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  form: { display: 'grid', gap: '0.75rem' },
  input: { padding: '0.7rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 },
};

export default async function JournalSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] ?? '' : params.q ?? '';
  const normalizedQuery = query.trim();
  const results = normalizedQuery ? searchJournalEntries(getAdapter(), normalizedQuery, 25) : [];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Search Journal</h1>
      <p style={styles.subtitle}>Local text search for titles, entry content, and tags</p>

      <div style={styles.nav}>
        <Link href="/journal" style={styles.navLink}>Today</Link>
        <Link href="/journal/entries" style={styles.navLink}>Entries</Link>
        <Link href="/journal/search" style={styles.navLink}>Search</Link>
        <Link href="/journal/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Search</div>
        <form action="/journal/search" style={styles.form}>
          <input
            name="q"
            defaultValue={normalizedQuery}
            placeholder="Search titles, body text, or tags"
            style={styles.input}
          />
        </form>
        <div style={styles.line}>
          Current hub build uses simple SQL text matching. The full spec still calls for a dedicated
          FTS5 index, stemming, and advanced filters.
        </div>
      </div>

      {!normalizedQuery ? (
        <div style={styles.card}>Enter a query to search your entries.</div>
      ) : results.length === 0 ? (
        <div style={styles.card}>No entries matched "{normalizedQuery}".</div>
      ) : (
        results.map((entry) => (
          <div key={entry.id} style={styles.card}>
            <div style={styles.sectionTitle}>{entry.title ?? 'Untitled entry'}</div>
            <div style={styles.line}>
              {entry.entryDate}
              {entry.matchedTagNames.length > 0 ? ` · matched tags: ${entry.matchedTagNames.join(', ')}` : ''}
            </div>
            <div style={styles.line}>{entry.body.slice(0, 240)}</div>
          </div>
        ))
      )}
    </div>
  );
}
