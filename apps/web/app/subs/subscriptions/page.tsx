'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchSubscriptions,
  doCreateSubscription,
  doDeleteSubscription,
  doTransitionSubscription,
  doSearchCatalog,
} from '../actions';
import Link from 'next/link';

interface Sub {
  id: string;
  name: string;
  price: number;
  billing_cycle:
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'semi_annual'
    | 'annual'
    | 'custom';
  category:
    | 'entertainment'
    | 'productivity'
    | 'health'
    | 'shopping'
    | 'news'
    | 'finance'
    | 'utilities'
    | 'other'
    | null;
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  next_renewal: string;
  icon: string | null;
}

interface CatalogHit {
  id: string;
  name: string;
  defaultPrice: number;
  billingCycle:
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'semi_annual'
    | 'annual'
    | 'custom';
  category:
    | 'entertainment'
    | 'productivity'
    | 'health'
    | 'shopping'
    | 'news'
    | 'finance'
    | 'utilities'
    | 'other';
  iconKey: string;
  url?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  trial: '#3B82F6',
  paused: '#EAB308',
  cancelled: '#EF4444',
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function cycleName(cycle: string): string {
  return cycle === 'semi_annual' ? 'Semi-Annual' : cycle.charAt(0).toUpperCase() + cycle.slice(1);
}

export default function SubscriptionsListPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogHit[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const loadSubs = useCallback(async () => {
    const filter = filterStatus ? { status: filterStatus as 'active' | 'paused' | 'cancelled' | 'trial' } : undefined;
    const data = await fetchSubscriptions(filter);
    setSubs(data as unknown as Sub[]);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await doSearchCatalog(q);
    setSearchResults(results.slice(0, 10) as CatalogHit[]);
  };

  const handleAddFromCatalog = async (entry: CatalogHit) => {
    const id = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    await doCreateSubscription(id, {
      name: entry.name,
      price: entry.defaultPrice,
      billing_cycle: entry.billingCycle,
      category: entry.category,
      status: 'active',
      start_date: today,
      next_renewal: today,
      catalog_id: entry.id,
      icon: entry.iconKey,
      url: entry.url ?? null,
    });
    setShowAdd(false);
    setSearchQuery('');
    setSearchResults([]);
    await loadSubs();
  };

  const handleDelete = async (id: string) => {
    await doDeleteSubscription(id);
    await loadSubs();
  };

  const handleTransition = async (id: string, newStatus: string) => {
    await doTransitionSubscription(id, newStatus as 'active' | 'paused' | 'cancelled' | 'trial');
    await loadSubs();
  };

  if (loading) {
    return <div style={{ padding: 32, color: '#aaa' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/subs" style={{ color: '#888', textDecoration: 'none', fontSize: 12 }}>&larr; Dashboard</Link>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, color: '#F59E0B' }}>Subscriptions</h1>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: '#F59E0B', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add from catalog */}
      {showAdd && (
        <div style={{ background: '#1a1814', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search catalog (e.g. Netflix, Spotify...)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0E0C09', color: '#fff', fontSize: 14, marginBottom: 8 }}
          />
          {searchResults.map((entry) => (
            <div
              key={entry.id}
              onClick={() => handleAddFromCatalog(entry)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 8px', borderBottom: '1px solid #222', cursor: 'pointer' }}
            >
              <span style={{ color: '#eee' }}>{entry.name}</span>
              <span style={{ color: '#888', fontSize: 13 }}>{formatCents(entry.defaultPrice)}/{cycleName(entry.billingCycle).toLowerCase()}</span>
            </div>
          ))}
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div style={{ color: '#666', padding: 12, textAlign: 'center' }}>No catalog matches</div>
          )}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'active', 'trial', 'paused', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setLoading(true); }}
            style={{
              background: filterStatus === s ? '#F59E0B' : '#1a1814',
              color: filterStatus === s ? '#000' : '#aaa',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Subscription list */}
      {subs.length === 0 ? (
        <div style={{ color: '#666', padding: 32, textAlign: 'center' }}>
          No subscriptions yet. Use the catalog to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.map((sub) => (
            <div key={sub.id} style={{ background: '#1a1814', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#eee', fontWeight: 600, fontSize: 15 }}>{sub.name}</span>
                    <span style={{ fontSize: 10, color: STATUS_COLORS[sub.status] ?? '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {sub.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {formatCents(sub.price)} / {cycleName(sub.billing_cycle).toLowerCase()}
                    {sub.category && <> &middot; {sub.category}</>}
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Renews {sub.next_renewal}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {sub.status === 'active' && (
                    <button
                      onClick={() => handleTransition(sub.id, 'paused')}
                      style={{ background: '#2a2520', color: '#EAB308', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                    >
                      Pause
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => handleTransition(sub.id, 'active')}
                      style={{ background: '#2a2520', color: '#22C55E', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                    >
                      Resume
                    </button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <button
                      onClick={() => handleTransition(sub.id, 'cancelled')}
                      style={{ background: '#2a2520', color: '#EF4444', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(sub.id)}
                    style={{ background: '#2a2520', color: '#EF4444', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
