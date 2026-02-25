'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSetting, doUpdateSetting, fetchSubscriptionCount } from '../actions';
import Link from 'next/link';

export default function SubsSettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [notifyDays, setNotifyDays] = useState('1');
  const [subCount, setSubCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const [curr, notify, count] = await Promise.all([
      fetchSetting('currency'),
      fetchSetting('defaultNotifyDays'),
      fetchSubscriptionCount(),
    ]);
    setCurrency(curr ?? 'USD');
    setNotifyDays(notify ?? '1');
    setSubCount(count);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    await Promise.all([
      doUpdateSetting('currency', currency),
      doUpdateSetting('defaultNotifyDays', notifyDays),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div style={{ padding: 32, color: '#aaa' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Link href="/subs" style={{ color: '#888', textDecoration: 'none', fontSize: 12 }}>&larr; Dashboard</Link>
      <h1 style={{ margin: '4px 0 24px', fontSize: 24, color: '#F59E0B' }}>MySubs Settings</h1>

      {/* Info */}
      <div style={{ background: '#1a1814', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Tracked Subscriptions</div>
        <div style={{ color: '#eee', fontSize: 20, fontWeight: 600 }}>{subCount}</div>
      </div>

      {/* Currency */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: '#ccc', fontSize: 13, display: 'block', marginBottom: 6 }}>Default Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0E0C09', color: '#fff', fontSize: 14 }}
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (&euro;)</option>
          <option value="GBP">GBP (&pound;)</option>
          <option value="CAD">CAD (C$)</option>
          <option value="AUD">AUD (A$)</option>
          <option value="JPY">JPY (&yen;)</option>
        </select>
      </div>

      {/* Notify days */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: '#ccc', fontSize: 13, display: 'block', marginBottom: 6 }}>Renewal Reminder (days before)</label>
        <select
          value={notifyDays}
          onChange={(e) => setNotifyDays(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0E0C09', color: '#fff', fontSize: 14 }}
        >
          <option value="0">Same day</option>
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
        </select>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        style={{
          background: '#F59E0B',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
