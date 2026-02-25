'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  doLoginSurfUser,
  doLogoutSurfUser,
  doRegisterSurfUser,
  doUpdateSurfProfile,
  fetchSurfAccountState,
  fetchSurfRegions,
  type SurfAuthUser,
  type SurfProfile,
} from '../actions';
import { SurfShell } from '../components/SurfShell';

interface AccountState {
  session: SurfAuthUser | null;
  profile: SurfProfile;
}

export default function SurfAccountPage() {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [regions, setRegions] = useState<string[]>([]);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [nextAccount, nextRegions] = await Promise.all([
      fetchSurfAccountState(),
      fetchSurfRegions(),
    ]);
    setAccount(nextAccount);
    setRegions(nextRegions);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateProfile = async (updates: Partial<SurfProfile>) => {
    if (!account?.session) return;
    setSaving(true);
    setError('');
    const result = await doUpdateSurfProfile(updates);
    if (!result.ok) {
      setError(result.reason);
    }
    await loadData();
    setSaving(false);
  };

  const handleAuth = async () => {
    setError('');
    setSaving(true);

    const result =
      mode === 'login'
        ? await doLoginSurfUser({ email, password })
        : await doRegisterSurfUser({ email, password, displayName });

    if (!result.ok) {
      setError(result.reason);
      setSaving(false);
      return;
    }

    setEmail('');
    setPassword('');
    setDisplayName('');
    await loadData();
    setSaving(false);
  };

  if (!account) {
    return (
      <SurfShell subtitle="Profile, auth, preferences, and premium controls">
        <div style={styles.empty}>Loading account...</div>
      </SurfShell>
    );
  }

  if (!account.session) {
    return (
      <SurfShell subtitle="Profile, auth, preferences, and premium controls">
        <div style={styles.authCard}>
          <h2 style={styles.heading}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <p style={styles.meta}>MySurf account settings are now available directly in-hub.</p>

          {mode === 'signup' && (
            <input
              style={styles.input}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display name"
            />
          )}
          <input
            style={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
          />
          <input
            style={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.primaryButton} onClick={() => void handleAuth()} disabled={saving}>
            {saving ? 'Working...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
              setError('');
            }}
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </SurfShell>
    );
  }

  return (
    <SurfShell subtitle="Profile, auth, preferences, and premium controls">
      <div style={styles.section}>
        <h2 style={styles.heading}>Profile</h2>
        <div style={styles.meta}>{account.session.displayName} · {account.session.email}</div>

        <div style={styles.formRow}>
          <label style={styles.label}>Home Region</label>
          <select
            value={account.profile.homeRegion}
            onChange={(event) => void updateProfile({ homeRegion: event.target.value })}
            style={styles.select}
            disabled={saving}
          >
            {regions.length === 0 && <option value="Santa Barbara">Santa Barbara</option>}
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Units</h2>
        <div style={styles.toggleRow}>
          <span style={styles.label}>Wave Height</span>
          <div style={styles.toggleGroup}>
            <button
              style={account.profile.waveUnit === 'ft' ? styles.toggleActive : styles.toggle}
              onClick={() => void updateProfile({ waveUnit: 'ft' })}
            >
              ft
            </button>
            <button
              style={account.profile.waveUnit === 'm' ? styles.toggleActive : styles.toggle}
              onClick={() => void updateProfile({ waveUnit: 'm' })}
            >
              m
            </button>
          </div>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.label}>Wind Speed</span>
          <div style={styles.toggleGroup}>
            <button
              style={account.profile.windUnit === 'kts' ? styles.toggleActive : styles.toggle}
              onClick={() => void updateProfile({ windUnit: 'kts' })}
            >
              kts
            </button>
            <button
              style={account.profile.windUnit === 'mph' ? styles.toggleActive : styles.toggle}
              onClick={() => void updateProfile({ windUnit: 'mph' })}
            >
              mph
            </button>
          </div>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.label}>Temperature</span>
          <div style={styles.toggleGroup}>
            <button
              style={account.profile.tempUnit === 'F' ? styles.toggleActive : styles.toggle}
              onClick={() => void updateProfile({ tempUnit: 'F' })}
            >
              F
            </button>
            <button
              style={account.profile.tempUnit === 'C' ? styles.toggleActive : styles.toggle}
              onClick={() => void updateProfile({ tempUnit: 'C' })}
            >
              C
            </button>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Notifications</h2>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={account.profile.dailyForecast}
            onChange={(event) => void updateProfile({ dailyForecast: event.target.checked })}
          />
          Daily Forecast
        </label>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={account.profile.swellAlerts}
            onChange={(event) => void updateProfile({ swellAlerts: event.target.checked })}
          />
          Swell Alerts
        </label>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={account.profile.sessionReminders}
            onChange={(event) => void updateProfile({ sessionReminders: event.target.checked })}
          />
          Session Reminders
        </label>
      </div>

      <div style={styles.section}>
        <h2 style={styles.heading}>Plan</h2>
        <div style={styles.meta}>Current plan: <strong>{account.profile.plan.toUpperCase()}</strong></div>
        <div style={styles.toggleGroup}>
          <button
            style={account.profile.plan === 'free' ? styles.toggleActive : styles.toggle}
            onClick={() => void updateProfile({ plan: 'free' })}
          >
            Free
          </button>
          <button
            style={account.profile.plan === 'premium' ? styles.toggleActive : styles.toggle}
            onClick={() => void updateProfile({ plan: 'premium' })}
          >
            Premium
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <button style={styles.dangerButton} onClick={() => void doLogoutSurfUser().then(loadData)}>
        Sign Out
      </button>
    </SurfShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  authCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxWidth: 480,
  },
  section: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  heading: {
    margin: 0,
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 600,
  },
  meta: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  input: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  select: {
    minWidth: 170,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text)',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: '#3B82F6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '8px 12px',
    background: 'var(--surface-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  toggleGroup: {
    display: 'flex',
    gap: 6,
  },
  toggle: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '6px 10px',
    background: 'var(--surface-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  toggleActive: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #3B82F6',
    padding: '6px 10px',
    background: 'rgba(59, 130, 246, 0.14)',
    color: '#3B82F6',
    cursor: 'pointer',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    padding: '8px 12px',
    background: 'var(--danger)',
    color: '#fff',
    cursor: 'pointer',
  },
  error: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    padding: '8px 10px',
    fontSize: 13,
  },
  empty: {
    padding: 14,
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
  },
};
