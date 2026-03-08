import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { listClothingItems, listOutfits, listWearLogs, logWearEvent } from '@mylife/closet';
import { getAdapter } from '@/lib/db';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-closet)', textDecoration: 'none', fontSize: '0.9rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  form: { display: 'grid', gap: '0.75rem' },
  row: { display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' },
  input: { padding: '0.7rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
  checklist: { display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' },
  small: { color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 },
  button: { background: 'var(--accent-closet)', color: '#0A0A0F', border: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontWeight: 700, cursor: 'pointer' },
  list: { display: 'grid', gap: '0.75rem' },
};

export default function ClosetCalendarPage() {
  const db = getAdapter();
  const items = listClothingItems(db, { status: 'active', limit: 200 });
  const outfits = listOutfits(db);
  const wearLogs = listWearLogs(db, { limit: 20 });
  const itemMap = new Map(items.map((item) => [item.id, item]));

  async function addWearLog(formData: FormData) {
    'use server';

    const today = new Date().toISOString().slice(0, 10);
    const outfitId = String(formData.get('outfitId') ?? '').trim() || null;
    const itemIds = formData.getAll('itemIds').map((value) => String(value));
    if (!outfitId && itemIds.length === 0) {
      return;
    }

    logWearEvent(getAdapter(), crypto.randomUUID(), {
      date: today,
      outfitId,
      itemIds,
      notes: String(formData.get('notes') ?? '').trim() || null,
    });

    revalidatePath('/closet/calendar');
    revalidatePath('/closet/stats');
    revalidatePath('/closet');
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Closet Calendar</h1>
      <p style={styles.subtitle}>Log what you wore and review recent wear history</p>

      <div style={styles.nav}>
        <Link href="/closet" style={styles.navLink}>Wardrobe</Link>
        <Link href="/closet/outfits" style={styles.navLink}>Outfits</Link>
        <Link href="/closet/calendar" style={styles.navLink}>Calendar</Link>
        <Link href="/closet/stats" style={styles.navLink}>Stats</Link>
        <Link href="/closet/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Log today&apos;s wear</div>
        <form action={addWearLog} style={styles.form}>
          <div style={styles.row}>
            <select name="outfitId" defaultValue="" style={styles.input}>
              <option value="">No saved outfit</option>
              {outfits.map((outfit) => (
                <option key={outfit.id} value={outfit.id}>{outfit.name}</option>
              ))}
            </select>
            <input name="notes" placeholder="Notes" style={styles.input} />
          </div>
          <div style={styles.checklist}>
            {items.map((item) => (
              <label key={item.id} style={styles.small}>
                <input type="checkbox" name="itemIds" value={item.id} /> {item.name}
              </label>
            ))}
          </div>
          <button type="submit" style={styles.button}>Log wear</button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Recent wear</div>
        <div style={styles.list}>
          {wearLogs.length === 0 ? (
            <div style={styles.small}>No wear logs yet.</div>
          ) : wearLogs.map((log) => (
            <div key={log.id} style={{ ...styles.card, marginBottom: 0 }}>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{log.date}</div>
              <div style={styles.small}>
                {log.itemIds.map((itemId) => itemMap.get(itemId)?.name ?? 'Unknown').join(', ')}
              </div>
              {log.notes ? <div style={styles.small}>{log.notes}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
