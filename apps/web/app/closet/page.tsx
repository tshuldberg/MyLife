import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClothingItem, getClosetDashboard, listClothingItems } from '@mylife/closet';
import type { ClothingCategory } from '@mylife/closet';
import { getAdapter } from '@/lib/db';

const CATEGORIES: ClothingCategory[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'activewear', 'other'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 980, margin: '0 auto' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.25rem' },
  nav: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const },
  navLink: { color: 'var(--accent-closet)', textDecoration: 'none', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  card: { background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-closet)' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  form: { display: 'grid', gap: '0.75rem' },
  row: { display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' },
  input: { padding: '0.7rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
  button: { background: 'var(--accent-closet)', color: '#0A0A0F', border: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontWeight: 700, cursor: 'pointer' },
  small: { color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: '0.75rem' },
};

function splitTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default async function ClosetPage() {
  const db = getAdapter();
  const items = listClothingItems(db, { status: 'active', limit: 200 });
  const dashboard = getClosetDashboard(db);

  async function addItem(formData: FormData) {
    'use server';

    const name = String(formData.get('name') ?? '').trim();
    const category = String(formData.get('category') ?? 'tops') as ClothingCategory;
    if (!name || !CATEGORIES.includes(category)) {
      return;
    }

    const price = String(formData.get('price') ?? '').trim();
    createClothingItem(getAdapter(), crypto.randomUUID(), {
      name,
      category,
      brand: String(formData.get('brand') ?? '').trim() || null,
      color: String(formData.get('color') ?? '').trim() || null,
      purchasePriceCents: price ? Math.round(Number(price) * 100) : null,
      tags: splitTags(String(formData.get('tags') ?? '')),
    });

    revalidatePath('/closet');
    revalidatePath('/closet/outfits');
    revalidatePath('/closet/calendar');
    revalidatePath('/closet/stats');
    revalidatePath('/closet/settings');
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>MyCloset</h1>
        <p style={styles.subtitle}>Local wardrobe catalog, outfits, and wear analytics</p>
      </div>

      <div style={styles.nav}>
        <Link href="/closet" style={styles.navLink}>Wardrobe</Link>
        <Link href="/closet/outfits" style={styles.navLink}>Outfits</Link>
        <Link href="/closet/calendar" style={styles.navLink}>Calendar</Link>
        <Link href="/closet/stats" style={styles.navLink}>Stats</Link>
        <Link href="/closet/settings" style={styles.navLink}>Settings</Link>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.statValue}>{dashboard.totalItems}</div>
          <div style={styles.small}>Active items</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>{dashboard.totalOutfits}</div>
          <div style={styles.small}>Outfits</div>
        </div>
        <div style={styles.card}>
          <div style={styles.statValue}>${(dashboard.wardrobeValueCents / 100).toFixed(0)}</div>
          <div style={styles.small}>Wardrobe value</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Add item</div>
        <form action={addItem} style={styles.form}>
          <div style={styles.row}>
            <input name="name" placeholder="Item name" style={styles.input} />
            <select name="category" defaultValue="tops" style={styles.input}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input name="brand" placeholder="Brand" style={styles.input} />
            <input name="color" placeholder="Color" style={styles.input} />
            <input name="price" placeholder="Price in dollars" style={styles.input} />
            <input name="tags" placeholder="Tags, comma separated" style={styles.input} />
          </div>
          <button type="submit" style={styles.button}>Save item</button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Catalog</div>
        <div style={styles.list}>
          {items.length === 0 ? (
            <div style={styles.small}>Your closet is empty.</div>
          ) : items.map((item) => (
            <div key={item.id} style={{ ...styles.card, marginBottom: 0 }}>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{item.name}</div>
              <div style={styles.small}>
                {item.category}
                {item.brand ? ` · ${item.brand}` : ''}
                {item.color ? ` · ${item.color}` : ''}
              </div>
              <div style={styles.small}>
                Worn {item.timesWorn} times
                {item.tags.length > 0 ? ` · ${item.tags.join(', ')}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
