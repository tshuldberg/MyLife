import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import {
  exportFlashData,
  getFlashDashboard,
  getFlashSetting,
  listDecks,
  listFlashExportRecords,
  setFlashSetting,
} from '@mylife/flash';
import { getAdapter } from '@/lib/db';

const TARGETS = ['1', '5', '10'];
const LIMITS = ['10', '20', '50', '100', '200'];
const REMINDER_TIMES = ['07:30', '09:00', '18:00', '21:00'];
const RETENTION = ['0.85', '0.90', '0.95'];

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
  const dailyNewLimit = getFlashSetting(db, 'dailyNewLimit') ?? '20';
  const dailyReviewLimit = getFlashSetting(db, 'dailyReviewLimit') ?? '200';
  const autoBurySiblings = getFlashSetting(db, 'autoBurySiblings') ?? '1';
  const reminderEnabled = getFlashSetting(db, 'dailyReminderEnabled') ?? '0';
  const reminderTime = getFlashSetting(db, 'dailyReminderTime') ?? '09:00';
  const desiredRetention = getFlashSetting(db, 'desiredRetention') ?? '0.90';
  const exportHistory = listFlashExportRecords(db).slice(0, 5);

  async function updateDailyTarget(formData: FormData) {
    'use server';

    const target = String(formData.get('target') ?? '');
    if (!TARGETS.includes(target)) {
      return;
    }

    setFlashSetting(getAdapter(), 'dailyStudyTarget', target);
    revalidatePath('/flash');
    revalidatePath('/flash/browser');
    revalidatePath('/flash/stats');
    revalidatePath('/flash/settings');
  }

  async function updateSetting(formData: FormData) {
    'use server';

    const key = String(formData.get('key') ?? '');
    const value = String(formData.get('value') ?? '');
    if (!key) {
      return;
    }

    setFlashSetting(getAdapter(), key, value);
    revalidatePath('/flash');
    revalidatePath('/flash/browser');
    revalidatePath('/flash/decks');
    revalidatePath('/flash/stats');
    revalidatePath('/flash/settings');
  }

  async function runExport(formData: FormData) {
    'use server';

    const mode = String(formData.get('mode') ?? 'json');
    exportFlashData(getAdapter(), {
      includeScheduling: mode !== 'text',
      includeTags: mode !== 'text',
    });
    revalidatePath('/flash/settings');
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Flash Settings</h1>
      <p style={styles.subtitle}>Module snapshot and spec-gap check</p>

      <div style={styles.nav}>
        <Link href="/flash" style={styles.navLink}>Study</Link>
        <Link href="/flash/decks" style={styles.navLink}>Decks</Link>
        <Link href="/flash/browser" style={styles.navLink}>Browse</Link>
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
        <div style={styles.sectionTitle}>Study limits</div>
        <div style={styles.line}>New cards/day: {dailyNewLimit}</div>
        <form action={updateSetting} style={styles.chipRow}>
          <input type="hidden" name="key" value="dailyNewLimit" />
          {LIMITS.slice(0, 4).map((value) => (
            <button
              key={`new-${value}`}
              type="submit"
              name="value"
              value={value}
              style={{
                ...styles.button,
                color: value === dailyNewLimit ? '#0A0A0F' : 'var(--text-secondary)',
                background: value === dailyNewLimit ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: value === dailyNewLimit ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {value}
            </button>
          ))}
        </form>
        <div style={{ ...styles.line, marginTop: '0.75rem' }}>Review cards/day: {dailyReviewLimit}</div>
        <form action={updateSetting} style={styles.chipRow}>
          <input type="hidden" name="key" value="dailyReviewLimit" />
          {LIMITS.map((value) => (
            <button
              key={`review-${value}`}
              type="submit"
              name="value"
              value={value}
              style={{
                ...styles.button,
                color: value === dailyReviewLimit ? '#0A0A0F' : 'var(--text-secondary)',
                background: value === dailyReviewLimit ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: value === dailyReviewLimit ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {value}
            </button>
          ))}
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Behavior</div>
        <div style={styles.line}>Auto-bury siblings: {autoBurySiblings === '1' ? 'On' : 'Off'}</div>
        <form action={updateSetting} style={styles.chipRow}>
          <input type="hidden" name="key" value="autoBurySiblings" />
          {[
            { label: 'On', value: '1' },
            { label: 'Off', value: '0' },
          ].map((option) => (
            <button
              key={option.value}
              type="submit"
              name="value"
              value={option.value}
              style={{
                ...styles.button,
                color: option.value === autoBurySiblings ? '#0A0A0F' : 'var(--text-secondary)',
                background: option.value === autoBurySiblings ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: option.value === autoBurySiblings ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {option.label}
            </button>
          ))}
        </form>
        <div style={{ ...styles.line, marginTop: '0.75rem' }}>Reminder: {reminderEnabled === '1' ? `On at ${reminderTime}` : 'Off'}</div>
        <form action={updateSetting} style={styles.chipRow}>
          <input type="hidden" name="key" value="dailyReminderEnabled" />
          {[
            { label: 'Off', value: '0' },
            { label: 'On', value: '1' },
          ].map((option) => (
            <button
              key={option.value}
              type="submit"
              name="value"
              value={option.value}
              style={{
                ...styles.button,
                color: option.value === reminderEnabled ? '#0A0A0F' : 'var(--text-secondary)',
                background: option.value === reminderEnabled ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: option.value === reminderEnabled ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {option.label}
            </button>
          ))}
        </form>
        <form action={updateSetting} style={styles.chipRow}>
          <input type="hidden" name="key" value="dailyReminderTime" />
          {REMINDER_TIMES.map((value) => (
            <button
              key={value}
              type="submit"
              name="value"
              value={value}
              style={{
                ...styles.button,
                color: value === reminderTime ? '#0A0A0F' : 'var(--text-secondary)',
                background: value === reminderTime ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: value === reminderTime ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {value}
            </button>
          ))}
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>FSRS target</div>
        <div style={styles.line}>Desired retention: {Number(desiredRetention) * 100}%</div>
        <form action={updateSetting} style={styles.chipRow}>
          <input type="hidden" name="key" value="desiredRetention" />
          {RETENTION.map((value) => (
            <button
              key={value}
              type="submit"
              name="value"
              value={value}
              style={{
                ...styles.button,
                color: value === desiredRetention ? '#0A0A0F' : 'var(--text-secondary)',
                background: value === desiredRetention ? 'var(--accent-flash)' : 'var(--surface)',
                borderColor: value === desiredRetention ? 'var(--accent-flash)' : 'var(--border)',
              }}
            >
              {Number(value) * 100}%
            </button>
          ))}
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Data</div>
        <div style={styles.line}>
          Current export covers local structured bundles and export history. Full .apkg package generation is still pending.
        </div>
        <form action={runExport} style={styles.chipRow}>
          <button type="submit" name="mode" value="json" style={styles.button}>JSON archive</button>
          <button type="submit" name="mode" value="markdown" style={styles.button}>Markdown handoff</button>
          <button type="submit" name="mode" value="text" style={styles.button}>Text share</button>
        </form>
        <div style={{ ...styles.line, marginTop: '0.75rem' }}>
          Recent exports: {exportHistory.length}
        </div>
        {exportHistory.map((record) => (
          <div key={record.id} style={styles.line}>
            {record.fileName} · {record.cardsExported} cards · {record.exportedAt.slice(0, 16)}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Spec Gap Check</div>
        <div style={styles.line}>
          Implemented now: deck creation, basic, reversed, and cloze cards, browser search, queue
          controls, reminder preferences, export history, study queue, lightweight scheduling, review logs, and streaks.
        </div>
        <div style={styles.line}>
          Still missing from the full spec: true FSRS parameterization, nested decks, rich media and image occlusion,
          bulk browser operations, import and .apkg packaging, undo review, AI generation, shared decks,
          practice tests, match game, leagues, and onboarding.
        </div>
      </div>
    </div>
  );
}
