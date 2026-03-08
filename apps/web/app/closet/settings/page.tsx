import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getClosetDashboard, getClosetSetting, listClothingItems, setClosetSetting } from '@mylife/closet';
import { getAdapter } from '@/lib/db';

const THRESHOLDS = ['90', '180', '365'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-closet)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 },
  chipRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginTop: '0.75rem' },
  button: { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.55rem 0.9rem', fontWeight: 600, cursor: 'pointer' },
};

export default async function ClosetSettingsPage() {
  const db = getAdapter();
  const items = listClothingItems(db, { status: 'active', limit: 500 });
  const dashboard = getClosetDashboard(db);
  const donationThreshold = getClosetSetting(db, 'donationThresholdDays') ?? '365';

  async function updateThreshold(formData: FormData) {
    'use server';

    const value = String(formData.get('value') ?? '');
    if (!THRESHOLDS.includes(value)) {
      return;
    }

    setClosetSetting(getAdapter(), 'donationThresholdDays', value);
    revalidatePath('/closet/stats');
    revalidatePath('/closet/settings');
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Closet Settings</h1>
      <p style={styles.subtitle}>Module snapshot and spec-gap check</p>

      <div style={styles.nav}>
        <Link href="/closet" style={styles.navLink}>Wardrobe</Link>
        <Link href="/closet/outfits" style={styles.navLink}>Outfits</Link>
        <Link href="/closet/calendar" style={styles.navLink}>Calendar</Link>
        <Link href="/closet/stats" style={styles.navLink}>Stats</Link>
        <Link href="/closet/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Snapshot</div>
        <div style={styles.line}>Items: {items.length}</div>
        <div style={styles.line}>Outfits: {dashboard.totalOutfits}</div>
        <div style={styles.line}>Donation candidates: {dashboard.donationCandidateCount}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Donation threshold</div>
        <div style={styles.line}>
          Items older than this many days since last wear are suggested for donation: {donationThreshold} days.
        </div>
        <form action={updateThreshold} style={styles.chipRow}>
          {THRESHOLDS.map((value) => (
            <button
              key={value}
              type="submit"
              name="value"
              value={value}
              style={{
                ...styles.button,
                color: value === donationThreshold ? '#0A0A0F' : 'var(--text-secondary)',
                background: value === donationThreshold ? 'var(--accent-closet)' : 'var(--surface)',
                borderColor: value === donationThreshold ? 'var(--accent-closet)' : 'var(--border)',
              }}
            >
              {value}d
            </button>
          ))}
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Spec Gap Check</div>
        <div style={styles.line}>
          Implemented now: wardrobe items, tags, outfits, wear logs, donation suggestions,
          wardrobe value, and settings-driven donation thresholds.
        </div>
        <div style={styles.line}>
          Still missing from the full spec: photo capture and quick capture, richer filter sheets,
          cost-per-wear surfaces in UI, laundry workflows, packing lists, AI outfit suggestions,
          seasonal rotation, wishlist, capsule wardrobes, color analysis, style boards, export, and onboarding.
        </div>
      </div>
    </div>
  );
}
