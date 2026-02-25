'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchUpcomingRenewals } from '../actions';
import Link from 'next/link';

interface Renewal {
  id: string;
  name: string;
  price: number;
  next_renewal: string;
  billing_cycle: string;
  status: string;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}

export default function SubsCalendarPage() {
  const [upcoming, setUpcoming] = useState<Renewal[]>([]);
  const [daysAhead, setDaysAhead] = useState(30);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchUpcomingRenewals(daysAhead);
    setUpcoming(data as unknown as Renewal[]);
    setLoading(false);
  }, [daysAhead]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group by date
  const grouped = new Map<string, Renewal[]>();
  for (const sub of upcoming) {
    const key = sub.next_renewal;
    const arr = grouped.get(key) ?? [];
    arr.push(sub);
    grouped.set(key, arr);
  }

  const totalUpcoming = upcoming.reduce((sum, s) => sum + s.price, 0);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Link href="/subs" style={{ color: '#888', textDecoration: 'none', fontSize: 12 }}>&larr; Dashboard</Link>
      <h1 style={{ margin: '4px 0 16px', fontSize: 24, color: '#F59E0B' }}>Renewal Calendar</h1>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDaysAhead(d)}
            style={{
              background: daysAhead === d ? '#F59E0B' : '#1a1814',
              color: daysAhead === d ? '#000' : '#aaa',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Total */}
      {!loading && (
        <div style={{ marginBottom: 20, color: '#888', fontSize: 14 }}>
          {upcoming.length} renewal{upcoming.length !== 1 ? 's' : ''} totaling{' '}
          <span style={{ color: '#F59E0B', fontWeight: 600 }}>{formatCents(totalUpcoming)}</span>
          {' '}in the next {daysAhead} days
        </div>
      )}

      {loading ? (
        <div style={{ color: '#aaa', padding: 32 }}>Loading...</div>
      ) : upcoming.length === 0 ? (
        <div style={{ color: '#666', padding: 32, textAlign: 'center' }}>No upcoming renewals in this window.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from(grouped.entries()).map(([date, items]) => (
            <div key={date}>
              <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 6 }}>
                {formatDay(date)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((sub) => (
                  <div
                    key={sub.id}
                    style={{ background: '#1a1814', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span style={{ color: '#eee' }}>{sub.name}</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{formatCents(sub.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
