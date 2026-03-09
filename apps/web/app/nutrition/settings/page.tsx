'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchAllSettings,
  fetchAllGoals,
  doSetSetting,
  doDeleteSetting,
  doCreateGoals,
  doUpdateGoals,
  doDeleteGoals,
  doExportFoodLog,
  doExportNutritionSummary,
} from '../actions';

interface GoalEntry {
  id: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  effectiveDate: string;
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  backLink: { fontSize: '0.85rem', color: 'var(--accent-nutrition)', marginBottom: '1rem', display: 'inline-block' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  form: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem',
  },
  formRow: { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' as const },
  label: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' },
  inputGroup: { flex: '1 1 140px' },
  input: {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.85rem',
    color: 'var(--text)', outline: 'none',
  },
  btnPrimary: {
    background: 'var(--accent-nutrition)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem', fontSize: '0.85rem',
    fontWeight: 600, cursor: 'pointer',
  },
  btnSmall: {
    background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer',
  },
  btnDanger: {
    background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer',
  },
  goalCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.5rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  goalDate: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' },
  goalMacros: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  settingRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
  },
  settingKey: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' },
  settingValue: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  exportCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '0.75rem',
  },
  exportTitle: { fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.25rem' },
  exportDesc: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
};

export default function NutritionSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal form
  const [newCal, setNewCal] = useState('2000');
  const [newProtein, setNewProtein] = useState('150');
  const [newCarbs, setNewCarbs] = useState('200');
  const [newFat, setNewFat] = useState('65');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));

  // API key setting
  const [offApiKey, setOffApiKey] = useState('');
  const [fatSecretKey, setFatSecretKey] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, g] = await Promise.all([fetchAllSettings(), fetchAllGoals()]);
      setSettings(s);
      setGoals(g as GoalEntry[]);
      setOffApiKey((s as Record<string, string>)['off_api_key'] ?? '');
      setFatSecretKey((s as Record<string, string>)['fatsecret_api_key'] ?? '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveGoal = useCallback(async () => {
    const id = crypto.randomUUID();
    await doCreateGoals(id, {
      calories: parseInt(newCal) || 2000,
      proteinG: parseInt(newProtein) || 150,
      carbsG: parseInt(newCarbs) || 200,
      fatG: parseInt(newFat) || 65,
      effectiveDate: newDate,
    });
    await loadData();
  }, [newCal, newProtein, newCarbs, newFat, newDate, loadData]);

  const handleDeleteGoal = useCallback(async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    await doDeleteGoals(id);
    await loadData();
  }, [loadData]);

  const handleSaveApiKeys = useCallback(async () => {
    if (offApiKey.trim()) await doSetSetting('off_api_key', offApiKey.trim());
    else await doDeleteSetting('off_api_key');
    if (fatSecretKey.trim()) await doSetSetting('fatsecret_api_key', fatSecretKey.trim());
    else await doDeleteSetting('fatsecret_api_key');
    await loadData();
  }, [offApiKey, fatSecretKey, loadData]);

  const handleExportFoodLog = useCallback(async () => {
    const csv = await doExportFoodLog();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-food-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportSummary = useCallback(async () => {
    const csv = await doExportNutritionSummary();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading settings...</div></div>;
  }

  return (
    <div style={styles.page}>
      <Link href="/nutrition" style={styles.backLink}>Back to Diary</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Configure goals, API keys, and data export</p>
      </div>

      {/* Daily Goals */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Daily Goals</h2>
        <div style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Calories</div>
              <input style={styles.input} type="number" value={newCal} onChange={(e) => setNewCal(e.target.value)} />
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Protein (g)</div>
              <input style={styles.input} type="number" value={newProtein} onChange={(e) => setNewProtein(e.target.value)} />
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Carbs (g)</div>
              <input style={styles.input} type="number" value={newCarbs} onChange={(e) => setNewCarbs(e.target.value)} />
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Fat (g)</div>
              <input style={styles.input} type="number" value={newFat} onChange={(e) => setNewFat(e.target.value)} />
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Effective Date</div>
              <input style={styles.input} type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={handleSaveGoal}>Set New Goal</button>
        </div>

        {goals.length === 0 ? (
          <div style={styles.empty}>No goals set. Add daily macro targets above.</div>
        ) : (
          goals.map((g) => (
            <div key={g.id} style={styles.goalCard}>
              <div>
                <div style={styles.goalDate}>Effective: {g.effectiveDate}</div>
                <div style={styles.goalMacros}>
                  {g.calories} cal | P: {g.proteinG}g | C: {g.carbsG}g | F: {g.fatG}g
                </div>
              </div>
              <button style={styles.btnDanger} onClick={() => handleDeleteGoal(g.id)}>Delete</button>
            </div>
          ))
        )}
      </div>

      {/* API Keys */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>API Keys</h2>
        <div style={styles.form}>
          <div style={styles.formRow}>
            <div style={{ ...styles.inputGroup, flex: '1 1 300px' }}>
              <div style={styles.label}>Open Food Facts API Key (optional)</div>
              <input
                style={styles.input}
                type="text"
                placeholder="Your OFF API key"
                value={offApiKey}
                onChange={(e) => setOffApiKey(e.target.value)}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={{ ...styles.inputGroup, flex: '1 1 300px' }}>
              <div style={styles.label}>FatSecret API Key (optional)</div>
              <input
                style={styles.input}
                type="text"
                placeholder="Your FatSecret API key"
                value={fatSecretKey}
                onChange={(e) => setFatSecretKey(e.target.value)}
              />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={handleSaveApiKeys}>Save API Keys</button>
        </div>
      </div>

      {/* Export */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Data Export</h2>
        <div style={styles.exportCard}>
          <div style={styles.exportTitle}>Food Log Export</div>
          <div style={styles.exportDesc}>Download all food log entries as CSV with date, meal, food name, servings, and macros.</div>
          <button style={styles.btnPrimary} onClick={handleExportFoodLog}>Export Food Log CSV</button>
        </div>
        <div style={styles.exportCard}>
          <div style={styles.exportTitle}>Nutrition Summary Export</div>
          <div style={styles.exportDesc}>Download daily summaries as CSV with total calories, macros, and meal counts.</div>
          <button style={styles.btnPrimary} onClick={handleExportSummary}>Export Summary CSV</button>
        </div>
      </div>

      {/* All Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>All Settings</h2>
        <div style={{
          background: 'var(--surface-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
        }}>
          {Object.keys(settings).length === 0 ? (
            <div style={styles.empty}>No settings configured.</div>
          ) : (
            Object.entries(settings).map(([key, value]) => (
              <div key={key} style={styles.settingRow}>
                <div style={styles.settingKey}>{key}</div>
                <div style={styles.settingValue}>{value.length > 50 ? value.slice(0, 47) + '...' : value}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
