import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import {
  getJournalDashboard,
  getJournalSetting,
  listJournalEntries,
  listJournalTags,
  setJournalSetting,
} from '@mylife/journal';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-journal)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 },
  button: { background: 'var(--accent-journal)', color: '#0A0A0F', border: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.75rem' },
};

export default async function JournalSettingsPage() {
  const db = getAdapter();
  const entries = listJournalEntries(db, { limit: 200 });
  const tags = listJournalTags(db);
  const dashboard = getJournalDashboard(db);
  const promptEnabled = getJournalSetting(db, 'dailyPromptEnabled') === 'true';

  async function togglePromptPreference() {
    'use server';

    setJournalSetting(getAdapter(), 'dailyPromptEnabled', promptEnabled ? 'false' : 'true');
    revalidatePath('/journal/settings');
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Journal Settings</h1>
      <p style={styles.subtitle}>Module snapshot and spec-gap check</p>

      <div style={styles.nav}>
        <Link href="/journal" style={styles.navLink}>Today</Link>
        <Link href="/journal/entries" style={styles.navLink}>Entries</Link>
        <Link href="/journal/search" style={styles.navLink}>Search</Link>
        <Link href="/journal/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Snapshot</div>
        <div style={styles.line}>Entries: {entries.length}</div>
        <div style={styles.line}>Tags: {tags.length}</div>
        <div style={styles.line}>Current streak: {dashboard.currentStreak}</div>
        <div style={styles.line}>Longest streak: {dashboard.longestStreak}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Prompt Preference</div>
        <div style={styles.line}>
          Stored locally: {promptEnabled ? 'enabled' : 'disabled'}. This only persists the preference
          for now. The spec-level 365-prompt rotation and prompt categories are still pending.
        </div>
        <form action={togglePromptPreference}>
          <button type="submit" style={styles.button}>
            {promptEnabled ? 'Disable prompt preference' : 'Enable prompt preference'}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Spec Gap Check</div>
        <div style={styles.line}>
          Implemented now: dated local entries, tags, mood labels, basic settings, simple local search,
          and streak plus word-count dashboard stats.
        </div>
        <div style={styles.line}>
          Still missing from the full spec: rich markdown editor and reading view, multiple journals,
          photo and voice attachment workflows, encryption with biometric lock, FTS5 search, calendar
          heatmap, On This Day, export, CBT and gratitude flows, metadata capture, and printed-book output.
        </div>
      </div>
    </div>
  );
}
