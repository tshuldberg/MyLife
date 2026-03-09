import Link from 'next/link';
import {
  getPetHealthTimeline,
  listExerciseLogsForPet,
  listGroomingRecordsForPet,
  listMedicationsForPet,
  listPets,
  listTrainingLogsForPet,
  listVaccinationsForPet,
  listVetVisitsForPet,
  listWeightEntriesForPet,
} from '@mylife/pets';
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

export default function PetsHealthPage() {
  const db = getAdapter();
  const pets = listPets(db);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Pet Health</h1>
      <p style={styles.subtitle}>Vet visits, vaccines, medications, weight, activity, grooming, and training</p>

      <div style={styles.nav}>
        <Link href="/pets" style={styles.navLink}>Pets</Link>
        <Link href="/pets/health" style={styles.navLink}>Health</Link>
        <Link href="/pets/reminders" style={styles.navLink}>Reminders</Link>
        <Link href="/pets/settings" style={styles.navLink}>Settings</Link>
      </div>

      {pets.length === 0 ? (
        <div style={styles.card}>No pets added yet.</div>
      ) : (
        pets.map((pet) => {
          const timeline = getPetHealthTimeline(db, pet.id, 3);

          return (
            <div key={pet.id} style={styles.card}>
              <div style={styles.sectionTitle}>{pet.name}</div>
              <div style={styles.list}>
                <div style={styles.line}>Vet visits: {listVetVisitsForPet(db, pet.id).length}</div>
                <div style={styles.line}>Vaccinations: {listVaccinationsForPet(db, pet.id).length}</div>
                <div style={styles.line}>Medications: {listMedicationsForPet(db, pet.id, true).length}</div>
                <div style={styles.line}>Weight logs: {listWeightEntriesForPet(db, pet.id).length}</div>
                <div style={styles.line}>Exercise logs: {listExerciseLogsForPet(db, pet.id).length}</div>
                <div style={styles.line}>Grooming records: {listGroomingRecordsForPet(db, pet.id).length}</div>
                <div style={styles.line}>Training sessions: {listTrainingLogsForPet(db, pet.id).length}</div>
                {timeline[0] ? (
                  <div style={styles.line}>
                    Latest timeline event: {timeline[0].title} on {timeline[0].occurredAt.slice(0, 10)}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
