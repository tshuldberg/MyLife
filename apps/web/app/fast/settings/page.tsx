'use client';

import { useState, useEffect } from 'react';
import { fetchSetting, updateSetting, doExportFastsCSV } from '../actions';

export default function FastSettingsPage() {
  const [defaultProtocol, setDefaultProtocol] = useState('16:8');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const proto = await fetchSetting('defaultProtocol');
      if (proto) setDefaultProtocol(proto);
      setLoading(false);
    }
    load();
  }, []);

  const handleProtocolChange = async (value: string) => {
    setDefaultProtocol(value);
    await updateSetting('defaultProtocol', value);
  };

  const handleExport = async () => {
    setExporting(true);
    const csv = await doExportFastsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myfast-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Configure your fasting preferences</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Default Protocol</h3>
        <div style={styles.protocolGrid}>
          {['16:8', '18:6', '20:4', '23:1', '36:0', '48:0'].map((proto) => (
            <button
              key={proto}
              onClick={() => handleProtocolChange(proto)}
              style={{
                ...styles.protocolButton,
                ...(defaultProtocol === proto ? styles.protocolButtonActive : {}),
              }}
            >
              {proto}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Data</h3>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={styles.exportButton}
        >
          {exporting ? 'Exporting...' : 'Export Fasts as CSV'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 12px 0',
  },
  protocolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  protocolButton: {
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  protocolButtonActive: {
    borderColor: 'var(--accent-fast, #14B8A6)',
    color: 'var(--accent-fast, #14B8A6)',
  },
  exportButton: {
    padding: '12px 24px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
