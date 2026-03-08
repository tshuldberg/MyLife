import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getFlashDashboard, getFlashSetting, listDecks, setFlashSetting } from '@mylife/flash';
import { getAdapter } from '@/lib/db';

const TARGETS = ['1', '5', '10'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-flash)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 },
  chipRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginTop: '0.75rem' },
  button: { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.55rem 0.9rem', fontWeight: 600, cursor: 'pointer' },
};

export default async function FlashSettingsPage() {
  const db = getAdapter();
  const dashboard = getFlashDashboard(db);
  const decks = listDecks(db);
  const dailyTarget = getFlashSetting(db, 'dailyStudyTarget') ?? '1';

  async function updateDailyTarget(formData: FormData) {
    'use server';

    const target = String(formData.get('target') ?? '');
    if (!TARGETS.includes(target)) {
      return;
    }

    setFlashSetting(getAdapter(), 'dailyStudyTarget', target);
    revalidatePath('/flash');
    revalidatePath('/flash/stats');
    revalidatePath('/flash/settings');
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Flash Settings</h1>
      <p style={styles.subtitle}>Module snapshot and spec-gap check</p>

      <div style={styles.nav}>
        <Link href="/flash" style={styles.navLink}>Study</Link>
        <Link href="/flash/decks" style={styles.navLink}>Decks</Link>
        <Link href="/flash/stats" style={styles.navLink}>Stats</Link>
        <Link href="/flash/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Snapshot</div>
        <div style={styles.line}>Decks: {decks.length}</div>
        <div style={styles.line}>Cards: {dashboard.cardCount}</div>
        <div style={styles.line}>Due reviews: {dashboard.dueCount}</div>
        <div style={styles.line}>Current streak: {dashboard.currentStreak}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Daily target</div>
        <div style={styles.line}>
          Reviews needed for streak credit in the current hub build: {dailyTarget}
        </div>
        <form action={updateDailyTarget} style={styles.chipRow}>
          {TARGETS.map((target) => (
            <button
              key={target}
              type="submit"
              name="target"
              value={target}
              style={{
                ...styles.button,
                color: target === dailyTarget ? '#0A0A0F' : 'var(--text-secondary)',
                background: target === dailyTarget ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: target === dailyTarget ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {target}/day
            </button>
          ))}
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Spec Gap Check</div>
        <div style={styles.line}>
          Implemented now: local deck creation, basic and reversed cards, study queue, lightweight
          card scheduling, review logs, streaks, and deck plus dashboard counts.
        </div>
        <div style={styles.line}>
          Still missing from the full spec: true FSRS parameterization, nested decks, cloze cards,
          rich media and markdown cards, suspend and bury controls, import and export, advanced card
          browser, reminders, AI generation, shared decks, practice tests, match game, leagues, and onboarding.
        </div>
      </div>
    </div>
  );
}
