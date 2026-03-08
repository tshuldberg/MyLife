import Link from 'next/link';
import { calculateCostPerWear, getClosetDashboard, listDonationCandidates } from '@mylife/closet';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-closet)', textDecoration: 'none', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-closet)' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 },
};

export default function ClosetStatsPage() {
  const db = getAdapter();
  const dashboard = getClosetDashboard(db);
  const donationCandidates = listDonationCandidates(db).slice(0, 8);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Closet Stats</h1>
      <p style={styles.subtitle}>Wear analytics, value tracking, and donation suggestions</p>

      <div style={styles.nav}>
        <Link href="/closet" style={styles.navLink}>Wardrobe</Link>
        <Link href="/closet/outfits" style={styles.navLink}>Outfits</Link>
        <Link href="/closet/calendar" style={styles.navLink}>Calendar</Link>
        <Link href="/closet/stats" style={styles.navLink}>Stats</Link>
        <Link href="/closet/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.statValue}>{dashboard.itemsWorn30Days}</div>
          <div style={styles.line}>Items worn in 30 days</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>{dashboard.donationCandidateCount}</div>
          <div style={styles.line}>Donation candidates</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>${(dashboard.wardrobeValueCents / 100).toFixed(0)}</div>
          <div style={styles.line}>Wardrobe value</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Donation candidates</div>
        {donationCandidates.length === 0 ? (
          <div style={styles.line}>Nothing is flagged right now.</div>
        ) : donationCandidates.map((item) => (
          <div key={item.id} style={styles.line}>
            {item.name}: last worn {item.lastWornDate ?? 'never'}
            {calculateCostPerWear(item) != null ? ` · $${(calculateCostPerWear(item)! / 100).toFixed(2)}/wear` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
