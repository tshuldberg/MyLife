import Link from 'next/link';
import { getJournalDashboard, listJournalEntries, listJournalTags } from '@mylife/journal';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-journal)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 },
  chipRow: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' as const, marginTop: '0.75rem' },
  chip: { padding: '0.45rem 0.8rem', borderRadius: '999px', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-secondary)', background: 'var(--surface)' },
};

export default async function JournalEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const db = getAdapter();
  const tags = listJournalTags(db);
  const entries = listJournalEntries(db, { tag: activeTag || undefined, limit: 50 });
  const dashboard = getJournalDashboard(db);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Journal Entries</h1>
      <p style={styles.subtitle}>Recent writing, tags, and streak context</p>

      <div style={styles.nav}>
        <Link href="/journal" style={styles.navLink}>Today</Link>
        <Link href="/journal/entries" style={styles.navLink}>Entries</Link>
        <Link href="/journal/search" style={styles.navLink}>Search</Link>
        <Link href="/journal/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Tag filters</div>
        <div style={styles.line}>
          Total entries: {dashboard.entryCount} · Current streak: {dashboard.currentStreak} · Longest streak: {dashboard.longestStreak}
        </div>
        <div style={styles.chipRow}>
          <Link href="/journal/entries" style={styles.chip}>All</Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/journal/entries?tag=${encodeURIComponent(tag.name)}`}
              style={{
                ...styles.chip,
                color: tag.name === activeTag ? '#0A0A0F' : 'var(--text-secondary)',
                background: tag.name === activeTag ? 'var(--accent-journal)' : 'var(--surface)',
                borderColor: tag.name === activeTag ? 'var(--accent-journal)' : 'var(--border)',
              }}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={styles.card}>No entries match this filter yet.</div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} style={styles.card}>
            <div style={styles.sectionTitle}>{entry.title ?? 'Untitled entry'}</div>
            <div style={styles.line}>
              {entry.entryDate}
              {entry.mood ? ` · ${entry.mood}` : ''}
              {entry.tags.length > 0 ? ` · ${entry.tags.join(', ')}` : ''}
            </div>
            <div style={styles.line}>{entry.body.slice(0, 240)}</div>
          </div>
        ))
      )}
    </div>
  );
}
