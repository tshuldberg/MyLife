import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createJournalEntry, getEntriesForDate, getJournalDashboard } from '@mylife/journal';
import type { JournalMood } from '@mylife/journal';
import { getAdapter } from '@/lib/db';

const JOURNAL_ACCENT = '#A78BFA';
const MOODS: JournalMood[] = ['low', 'okay', 'good', 'great', 'grateful'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-journal)', textDecoration: 'none', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: JOURNAL_ACCENT },
  small: { color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  form: { display: 'grid', gap: '0.75rem' },
  row: { display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' },
  input: { padding: '0.7rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
  textarea: { minHeight: '180px', resize: 'vertical' as const },
  button: { background: JOURNAL_ACCENT, color: '#0A0A0F', border: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontWeight: 700, cursor: 'pointer' },
  list: { display: 'grid', gap: '0.75rem' },
};

function splitTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default async function JournalPage() {
  const today = new Date().toISOString().slice(0, 10);
  const db = getAdapter();
  const todayEntries = getEntriesForDate(db, today);
  const dashboard = getJournalDashboard(db, today);

  async function addEntry(formData: FormData) {
    'use server';

    const body = String(formData.get('body') ?? '').trim();
    if (!body) {
      return;
    }

    const moodValue = String(formData.get('mood') ?? '').trim();
    createJournalEntry(getAdapter(), crypto.randomUUID(), {
      entryDate: today,
      title: String(formData.get('title') ?? '').trim() || null,
      body,
      tags: splitTags(String(formData.get('tags') ?? '')),
      mood: (MOODS.includes(moodValue as JournalMood) ? moodValue : null) as JournalMood | null,
    });

    revalidatePath('/journal');
    revalidatePath('/journal/entries');
    revalidatePath('/journal/search');
    revalidatePath('/journal/settings');
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>MyJournal</h1>
        <p style={styles.subtitle}>Private local entries, tags, moods, and streak tracking</p>
      </div>

      <div style={styles.nav}>
        <Link href="/journal" style={styles.navLink}>Today</Link>
        <Link href="/journal/entries" style={styles.navLink}>Entries</Link>
        <Link href="/journal/search" style={styles.navLink}>Search</Link>
        <Link href="/journal/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.statValue}>{todayEntries.length}</div>
          <div style={styles.small}>Entries today</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>{dashboard.currentStreak}</div>
          <div style={styles.small}>Current streak</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>{dashboard.monthlyWords}</div>
          <div style={styles.small}>Words this month</div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
        <div style={styles.sectionTitle}>New entry</div>
        <form action={addEntry} style={styles.form}>
          <div style={styles.row}>
            <input name="title" placeholder="Title (optional)" style={styles.input} />
            <input name="tags" placeholder="Tags, comma separated" style={styles.input} />
            <select name="mood" defaultValue="" style={styles.input}>
              <option value="">No mood</option>
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>
          <textarea
            name="body"
            placeholder="Write what happened, what mattered, or what you want to remember."
            style={{ ...styles.input, ...styles.textarea }}
          />
          <button type="submit" style={styles.button}>Save entry</button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Today&apos;s entries</div>
        <div style={styles.list}>
          {todayEntries.length === 0 ? (
            <div style={styles.small}>No entries yet today.</div>
          ) : todayEntries.map((entry) => (
            <div key={entry.id} style={styles.card}>
              <div style={styles.sectionTitle}>{entry.title ?? 'Untitled entry'}</div>
              <div style={styles.small}>
                {entry.wordCount} words
                {entry.mood ? ` · mood: ${entry.mood}` : ''}
                {entry.tags.length > 0 ? ` · ${entry.tags.join(', ')}` : ''}
              </div>
              <div style={styles.small}>{entry.body.slice(0, 220)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
