import Link from 'next/link';
import { collectMedicationReminders, listDueMedications, listDueVaccinationReminders, listPets } from '@mylife/pets';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-pets)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' },
  list: { display: 'grid', gap: '0.4rem' },
  line: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
};

export default function PetsRemindersPage() {
  const db = getAdapter();
  const pets = listPets(db).map((pet) => ({ id: pet.id, name: pet.name }));
  const vaccinationReminders = listDueVaccinationReminders(db, new Date().toISOString().slice(0, 10), 30);
  const medicationReminders = collectMedicationReminders(
    pets,
    listDueMedications(db, new Date().toISOString(), 48),
    new Date().toISOString(),
    2,
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Care Reminders</h1>
      <p style={styles.subtitle}>Upcoming vaccines and medications</p>

      <div style={styles.nav}>
        <Link href="/pets" style={styles.navLink}>Pets</Link>
        <Link href="/pets/health" style={styles.navLink}>Health</Link>
        <Link href="/pets/reminders" style={styles.navLink}>Reminders</Link>
        <Link href="/pets/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Vaccines</div>
        <div style={styles.list}>
          {vaccinationReminders.length === 0 ? (
            <div style={styles.line}>No vaccines due soon.</div>
          ) : vaccinationReminders.map((reminder) => (
            <div key={reminder.vaccinationId} style={styles.line}>
              {reminder.petName}: {reminder.vaccineName} on {reminder.nextDueDate} ({reminder.status})
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Medications</div>
        <div style={styles.list}>
          {medicationReminders.length === 0 ? (
            <div style={styles.line}>No medication reminders due soon.</div>
          ) : medicationReminders.map((reminder) => (
            <div key={reminder.medicationId} style={styles.line}>
              {reminder.petName}: {reminder.medicationName} at {reminder.nextDueAt} ({reminder.status})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
