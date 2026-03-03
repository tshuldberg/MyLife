'use client';

import { useState } from 'react';
import Link from 'next/link';
import { doGenerateDoctorReport, doGenerateTherapyReport } from '../actions';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 720, margin: '0 auto' },
  backLink: { color: '#10B981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { color: '#9CA3AF', marginBottom: '2rem' },
  card: { background: '#1E1E1E', borderRadius: 8, padding: '1.25rem', border: '1px solid #333', marginBottom: '1rem' },
  cardTitle: { fontWeight: 600, color: '#E5E7EB', fontSize: '1rem', marginBottom: '0.25rem' },
  cardDesc: { fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '0.75rem' },
  btn: {
    background: '#10B981', color: '#fff', border: 'none', borderRadius: 6,
    padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },
  reportBox: {
    marginTop: '1rem', background: '#111', border: '1px solid #333', borderRadius: 6,
    padding: '1rem', maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap' as const,
    fontSize: '0.8rem', color: '#D1D5DB', lineHeight: 1.6,
  },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '0.75rem' },
  btnSecondary: {
    background: 'transparent', color: '#10B981', border: '1px solid #10B981', borderRadius: 6,
    padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer',
  },
  empty: { textAlign: 'center' as const, color: '#6B7280', padding: '2rem', fontSize: '0.9rem' },
};

export default function ExportPage() {
  const [doctorReport, setDoctorReport] = useState<string | null>(null);
  const [therapyReport, setTherapyReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState<'doctor' | 'therapy' | null>(null);

  const handleDoctorReport = async () => {
    setGenerating('doctor');
    try {
      const report = await doGenerateDoctorReport();
      setDoctorReport(report);
    } catch {
      setDoctorReport('Failed to generate report. Make sure you have health data logged.');
    } finally {
      setGenerating(null);
    }
  };

  const handleTherapyReport = async () => {
    setGenerating('therapy');
    try {
      const report = await doGenerateTherapyReport();
      setTherapyReport(report);
    } catch {
      setTherapyReport('Failed to generate report. Make sure you have health data logged.');
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={styles.page}>
      <Link href="/health" style={styles.backLink}>Back to Health</Link>
      <h1 style={styles.title}>Health Reports</h1>
      <p style={styles.subtitle}>Generate reports for your doctor or therapist (last 90 days)</p>

      {/* Doctor Report */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Doctor Report</div>
        <div style={styles.cardDesc}>
          Comprehensive summary of medications, vitals, adherence, and health metrics for your physician.
        </div>
        <button
          style={{ ...styles.btn, opacity: generating === 'doctor' ? 0.5 : 1 }}
          onClick={handleDoctorReport}
          disabled={generating === 'doctor'}
        >
          {generating === 'doctor' ? 'Generating...' : 'Generate Doctor Report'}
        </button>

        {doctorReport && (
          <>
            <div style={styles.reportBox}>{doctorReport}</div>
            <div style={styles.actions}>
              <button style={styles.btnSecondary} onClick={() => copyToClipboard(doctorReport)}>
                Copy to Clipboard
              </button>
            </div>
          </>
        )}
      </div>

      {/* Therapy Report */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Therapy Report</div>
        <div style={styles.cardDesc}>
          Mood patterns, wellness timeline, and emotional health summary for your therapist or counselor.
        </div>
        <button
          style={{ ...styles.btn, opacity: generating === 'therapy' ? 0.5 : 1 }}
          onClick={handleTherapyReport}
          disabled={generating === 'therapy'}
        >
          {generating === 'therapy' ? 'Generating...' : 'Generate Therapy Report'}
        </button>

        {therapyReport && (
          <>
            <div style={styles.reportBox}>{therapyReport}</div>
            <div style={styles.actions}>
              <button style={styles.btnSecondary} onClick={() => copyToClipboard(therapyReport)}>
                Copy to Clipboard
              </button>
            </div>
          </>
        )}
      </div>

      <div style={styles.empty}>
        Reports cover the most recent 90 days of health data. They include medication adherence, mood entries, vitals, and overall wellness trends.
      </div>
    </div>
  );
}
