'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSummary, fetchUpcomingRenewals } from './actions';
import Link from 'next/link';

interface CategoryCost {
  category: string | null;
  monthlyCost: number;
  count: number;
}

interface Summary {
  monthlyTotal: number;
  annualTotal: number;
  dailyCost: number;
  byCategory: CategoryCost[];
  activeCount: number;
  totalCount: number;
}

interface Renewal {
  id: string;
  name: string;
  price: number;
  next_renewal: string;
  billing_cycle: string;
  icon: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: 'Entertainment',
  productivity: 'Productivity',
  health: 'Health',
  shopping: 'Shopping',
  news: 'News',
  finance: 'Finance',
  utilities: 'Utilities',
  other: 'Other',
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function SubsDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [upcoming, setUpcoming] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [sum, renewals] = await Promise.all([
      fetchSummary(),
      fetchUpcomingRenewals(14),
    ]);
    setSummary(sum);
    setUpcoming(renewals as unknown as Renewal[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div style={{ padding: 32, color: '#aaa' }}>Loading...</div>;
  }

  if (!summary) {
    return <div style={{ padding: 32, color: '#aaa' }}>No data</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: '#F59E0B' }}>MySubs</h1>
        <Link href="/subs/subscriptions" style={{ color: '#F59E0B', textDecoration: 'none', fontSize: 14 }}>
          Manage Subscriptions &rarr;
        </Link>
      </div>

      {/* Cost cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#1a1814', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Monthly</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#F59E0B' }}>{formatCents(summary.monthlyTotal)}</div>
        </div>
        <div style={{ background: '#1a1814', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Annual</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{formatCents(summary.annualTotal)}</div>
        </div>
        <div style={{ background: '#1a1814', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Daily</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{formatCents(summary.dailyCost)}</div>
        </div>
      </div>

      {/* Active count */}
      <div style={{ marginBottom: 24, color: '#888', fontSize: 14 }}>
        {summary.activeCount} active of {summary.totalCount} total subscriptions
      </div>

      {/* Category breakdown */}
      <h2 style={{ fontSize: 18, marginBottom: 12, color: '#ccc' }}>By Category</h2>
      {summary.byCategory.length === 0 ? (
        <div style={{ color: '#666', padding: 16 }}>No subscriptions yet. Add one to get started.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {summary.byCategory.map((cat) => {
            const pct = summary.monthlyTotal > 0 ? (cat.monthlyCost / summary.monthlyTotal) * 100 : 0;
            return (
              <div key={cat.category ?? 'none'} style={{ background: '#1a1814', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#eee' }}>{CATEGORY_LABELS[cat.category ?? ''] ?? 'Other'}</span>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>{formatCents(cat.monthlyCost)}/mo</span>
                </div>
                <div style={{ background: '#2a2520', borderRadius: 4, height: 6 }}>
                  <div style={{ background: '#F59E0B', borderRadius: 4, height: 6, width: `${pct}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{cat.count} subscription{cat.count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming renewals */}
      <h2 style={{ fontSize: 18, marginBottom: 12, color: '#ccc' }}>Upcoming Renewals (14 days)</h2>
      {upcoming.length === 0 ? (
        <div style={{ color: '#666', padding: 16 }}>No upcoming renewals.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcoming.map((sub) => (
            <div key={sub.id} style={{ background: '#1a1814', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#eee', fontWeight: 500 }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Renews {sub.next_renewal}</div>
              </div>
              <div style={{ color: '#F59E0B', fontWeight: 600 }}>{formatCents(sub.price)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
