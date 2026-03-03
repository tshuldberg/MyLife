'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchEmergencyInfo, doUpdateEmergencyInfo } from '../actions';
import type { BloodType } from '@mylife/health';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 720, margin: '0 auto' },
  backLink: { color: '#10B981', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { color: '#9CA3AF', marginBottom: '2rem' },
  form: { background: '#1E1E1E', borderRadius: 8, padding: '1.5rem', border: '1px solid #333' },
  fieldGroup: { marginBottom: '1.25rem' },
  label: { fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.35rem', display: 'block' },
  input: {
    width: '100%', background: '#111', border: '1px solid #333', borderRadius: 6,
    padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#E5E7EB',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%', background: '#111', border: '1px solid #333', borderRadius: 6,
    padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#E5E7EB',
    resize: 'vertical' as const, minHeight: 60, boxSizing: 'border-box' as const,
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  chipRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const },
  chip: {
    padding: '0.3rem 0.6rem', borderRadius: 4, border: '1px solid #333',
    background: '#111', fontSize: '0.8rem', color: '#D1D5DB', cursor: 'pointer',
  },
  chipActive: { background: '#10B981', borderColor: '#10B981', color: '#111' },
  btn: {
    background: '#10B981', color: '#fff', border: 'none', borderRadius: 6,
    padding: '0.6rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
    marginTop: '1rem',
  },
  success: { color: '#10B981', fontSize: '0.85rem', marginTop: '0.75rem' },
};

export default function EmergencyPage() {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [contacts, setContacts] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [physician, setPhysician] = useState('');
  const [physicianPhone, setPhysicianPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const info = await fetchEmergencyInfo();
      if (info) {
        setFullName(info.full_name ?? '');
        setDob(info.date_of_birth ?? '');
        setBloodType((info.blood_type as BloodType) ?? '');
        setAllergies(info.allergies ?? '');
        setConditions(info.conditions ?? '');
        setContacts(info.emergency_contacts ?? '');
        setInsuranceProvider(info.insurance_provider ?? '');
        setInsurancePolicy(info.insurance_policy_number ?? '');
        setPhysician(info.primary_physician ?? '');
        setPhysicianPhone(info.physician_phone ?? '');
        setNotes(info.notes ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    await doUpdateEmergencyInfo({
      full_name: fullName.trim() || undefined,
      date_of_birth: dob.trim() || undefined,
      blood_type: bloodType || undefined,
      allergies: allergies.trim() || undefined,
      conditions: conditions.trim() || undefined,
      emergency_contacts: contacts.trim() || undefined,
      insurance_provider: insuranceProvider.trim() || undefined,
      insurance_policy_number: insurancePolicy.trim() || undefined,
      primary_physician: physician.trim() || undefined,
      physician_phone: physicianPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div style={styles.page}><div style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>Loading...</div></div>;
  }

  return (
    <div style={styles.page}>
      <Link href="/health" style={styles.backLink}>Back to Health</Link>
      <h1 style={styles.title}>Emergency Info (ICE Card)</h1>
      <p style={styles.subtitle}>Store critical health information for emergencies</p>

      <div style={styles.form}>
        {/* Personal */}
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Date of Birth</label>
            <input style={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
        </div>

        {/* Blood Type */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Blood Type</label>
          <div style={styles.chipRow}>
            {BLOOD_TYPES.map((bt) => (
              <span
                key={bt}
                style={{ ...styles.chip, ...(bloodType === bt ? styles.chipActive : {}) }}
                onClick={() => setBloodType(bt)}
              >
                {bt}
              </span>
            ))}
          </div>
        </div>

        {/* Medical */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Allergies</label>
          <textarea style={styles.textarea} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Drug and food allergies..." />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Medical Conditions</label>
          <textarea style={styles.textarea} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Chronic conditions, diagnoses..." />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Emergency Contacts</label>
          <textarea style={styles.textarea} value={contacts} onChange={(e) => setContacts(e.target.value)} placeholder="Name: Phone, Name: Phone..." />
        </div>

        {/* Insurance */}
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Insurance Provider</label>
            <input style={styles.input} value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Policy Number</label>
            <input style={styles.input} value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} />
          </div>
        </div>

        {/* Physician */}
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Primary Physician</label>
            <input style={styles.input} value={physician} onChange={(e) => setPhysician(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Physician Phone</label>
            <input style={styles.input} value={physicianPhone} onChange={(e) => setPhysicianPhone(e.target.value)} />
          </div>
        </div>

        {/* Notes */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Additional Notes</label>
          <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information..." />
        </div>

        <button style={styles.btn} onClick={handleSave}>Save Emergency Info</button>
        {saved && <div style={styles.success}>Saved successfully</div>}
      </div>
    </div>
  );
}
