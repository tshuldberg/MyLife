import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createPet, getPetDashboard, listPets } from '@mylife/pets';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-pets)', textDecoration: 'none', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-pets)' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  form: { display: 'grid', gap: '0.75rem' },
  row: { display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' },
  input: { padding: '0.7rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
  button: { background: 'var(--accent-pets)', color: '#0A0A0F', border: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontWeight: 700, cursor: 'pointer' },
  petList: { display: 'grid', gap: '0.75rem' },
  small: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' },
};

export default async function PetsPage() {
  const db = getAdapter();
  const pets = listPets(db, { includeArchived: true });
  const dashboards = pets.map((pet) => ({
    pet,
    dashboard: getPetDashboard(db, pet.id),
  }));

  async function addPet(formData: FormData) {
    'use server';

    const name = String(formData.get('name') ?? '').trim();
    if (!name) return;

    createPet(getAdapter(), crypto.randomUUID(), {
      name,
      species: String(formData.get('species') ?? 'dog') as 'dog',
      breed: String(formData.get('breed') ?? '').trim() || null,
      birthDate: String(formData.get('birthDate') ?? '').trim() || null,
    });

    revalidatePath('/pets');
    revalidatePath('/pets/health');
    revalidatePath('/pets/reminders');
    revalidatePath('/pets/settings');
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>MyPets</h1>
        <p style={styles.subtitle}>Pet profiles, care tracking, and reminders</p>
      </div>

      <div style={styles.nav}>
        <Link href="/pets" style={styles.navLink}>Pets</Link>
        <Link href="/pets/health" style={styles.navLink}>Health</Link>
        <Link href="/pets/reminders" style={styles.navLink}>Reminders</Link>
        <Link href="/pets/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.statValue}>{pets.filter((pet) => !pet.isArchived).length}</div>
          <div style={styles.small}>Active pets</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>{pets.filter((pet) => pet.isArchived).length}</div>
          <div style={styles.small}>Archived pets</div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
        <div style={styles.sectionTitle}>Add Pet</div>
        <form action={addPet} style={styles.form}>
          <div style={styles.row}>
            <input name="name" placeholder="Pet name" style={styles.input} />
            <select name="species" style={styles.input} defaultValue="dog">
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
              <option value="other">Other</option>
            </select>
            <input name="breed" placeholder="Breed" style={styles.input} />
            <input name="birthDate" placeholder="Birth date YYYY-MM-DD" style={styles.input} />
          </div>
          <button type="submit" style={styles.button}>Save Pet</button>
        </form>
      </div>

      <div style={styles.petList}>
        {dashboards.length === 0 ? (
          <div style={styles.card}>No pets added yet.</div>
        ) : (
          dashboards.map(({ pet, dashboard }) => (
            <div key={pet.id} style={styles.card}>
              <div style={styles.sectionTitle}>{pet.name}</div>
              <div style={styles.small}>
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ''}
                {pet.isArchived ? ' · archived' : ''}
              </div>
              {dashboard ? (
                <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.35rem' }}>
                  <div style={styles.small}>Due vaccines: {dashboard.dueVaccinations}</div>
                  <div style={styles.small}>Due meds: {dashboard.dueMedications}</div>
                  <div style={styles.small}>Weight: {dashboard.latestWeightGrams ? `${(dashboard.latestWeightGrams / 1000).toFixed(1)} kg` : 'N/A'}</div>
                  <div style={styles.small}>Expenses: ${(dashboard.totalExpensesCents / 100).toFixed(2)}</div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
