'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  doCreateHomeListing,
  doDeleteHomeListing,
  doToggleHomeListingSaved,
  fetchHomeListings,
  fetchHomesOverview,
} from './actions';

export default function HomesPage() {
  const [overview, setOverview] = useState({
    listings: 0,
    savedListings: 0,
    averagePriceCents: 0,
    averagePricePerSqft: 0,
  });
  const [listings, setListings] = useState<Array<{
    id: string;
    address: string;
    city: string;
    state: string;
    priceCents: number;
    isSaved: boolean;
  }>>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('CA');
  const [price, setPrice] = useState('850000');

  const loadData = useCallback(async () => {
    const [nextOverview, nextListings] = await Promise.all([
      fetchHomesOverview(),
      fetchHomeListings(),
    ]);
    setOverview(nextOverview);
    setListings(nextListings.map((listing) => ({
      id: listing.id,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      priceCents: listing.priceCents,
      isSaved: listing.isSaved,
    })));
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>MyHomes</h1>
      <p style={styles.subtitle}>Listings, saves, and tour planning.</p>

      <div style={styles.metrics}>
        <Metric label="Listings" value={String(overview.listings)} />
        <Metric label="Saved" value={String(overview.savedListings)} />
        <Metric label="Avg Price" value={`$${Math.round(overview.averagePriceCents / 100).toLocaleString()}`} />
        <Metric label="Avg $/sqft" value={`$${Math.round(overview.averagePricePerSqft)}`} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add Listing</h2>
        <div style={styles.row}>
          <input style={styles.input} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Address" />
          <input style={styles.input} value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
          <input style={styles.input} value={stateCode} onChange={(event) => setStateCode(event.target.value.toUpperCase())} placeholder="State" />
          <input style={styles.input} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" />
          <button
            style={styles.primaryButton}
            onClick={() =>
              void doCreateHomeListing(crypto.randomUUID(), {
                address: address.trim() || 'New Listing',
                city: city.trim() || 'Unknown',
                state: stateCode.trim() || 'CA',
                priceCents: Math.max(0, Number(price) || 0) * 100,
                bedrooms: 3,
                bathrooms: 2,
                sqft: 1400,
              }).then(loadData)
            }
          >
            Add
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Listing Feed</h2>
        <div style={styles.list}>
          {listings.map((listing) => (
            <div key={listing.id} style={styles.item}>
              <div>
                <div style={styles.itemTitle}>{listing.address}</div>
                <div style={styles.meta}>{listing.city}, {listing.state} · ${Math.round(listing.priceCents / 100).toLocaleString()}</div>
              </div>
              <div style={styles.actions}>
                <button style={styles.secondaryButton} onClick={() => void doToggleHomeListingSaved(listing.id).then(loadData)}>
                  {listing.isSaved ? 'Saved' : 'Save'}
                </button>
                <button style={styles.dangerButton} onClick={() => void doDeleteHomeListing(listing.id).then(loadData)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {listings.length === 0 && <div style={styles.empty}>No listings yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  title: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 30,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  metricCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 14,
  },
  metricLabel: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    marginTop: 6,
    color: '#D97706',
    fontSize: 20,
    fontWeight: 700,
  },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
  },
  sectionTitle: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  row: {
    marginTop: 10,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    minWidth: 120,
    flex: 1,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  primaryButton: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: '#D97706',
    color: '#fff',
    padding: '8px 12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 10,
    background: 'var(--surface-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  meta: {
    marginTop: 2,
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  secondaryButton: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  dangerButton: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--danger)',
    color: '#fff',
    padding: '7px 10px',
    cursor: 'pointer',
  },
  empty: {
    padding: 14,
    textAlign: 'center',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-tertiary)',
  },
};
