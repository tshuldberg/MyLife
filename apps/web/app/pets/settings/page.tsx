import Link from 'next/link';
import { listDueVaccinationReminders, listPets } from '@mylife/pets';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-pets)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 },
};

export default function PetsSettingsPage() {
  const db = getAdapter();
  const pets = listPets(db, { includeArchived: true });
  const dueVaccines = listDueVaccinationReminders(db, new Date().toISOString().slice(0, 10), 30);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Pets Settings</h1>
      <p style={styles.subtitle}>Current hub scope and module status</p>

      <div style={styles.nav}>
        <Link href="/pets" style={styles.navLink}>Pets</Link>
        <Link href="/pets/health" style={styles.navLink}>Health</Link>
        <Link href="/pets/reminders" style={styles.navLink}>Reminders</Link>
        <Link href="/pets/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Snapshot</div>
        <div style={styles.line}>Tracked pets: {pets.length}</div>
        <div style={styles.line}>Vaccines due in 30 days: {dueVaccines.length}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Spec Gap Check</div>
        <div style={styles.line}>
          Implemented in the hub now: pet profiles, vet visits, vaccination tracking, medication reminders,
          weight logging, feeding schedules, expenses, and dashboard summaries.
        </div>
        <div style={styles.line}>
          Still missing from the full spec: emergency contacts, document storage, sitter export cards,
          grooming schedules, training logs, breed-specific alerts, and richer PDF export flows.
        </div>
      </div>
    </div>
  );
}
