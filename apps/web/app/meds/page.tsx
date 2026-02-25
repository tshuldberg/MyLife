'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  fetchMedications,
  fetchMedicationCount,
  fetchDosesForDate,
  fetchAdherenceRate,
  doCreateMedication,
  doUpdateMedication,
  doDeleteMedication,
  doRecordDose,
  doDeleteDose,
} from './actions';

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  unit: string | null;
  frequency: string | null;
  instructions: string | null;
  prescriber: string | null;
  pharmacy: string | null;
  refillDate: string | null;
  isActive: boolean;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Dose {
  id: string;
  medicationId: string;
  takenAt: string;
  skipped: boolean;
  notes: string | null;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  twice_daily: 'Twice Daily',
  weekly: 'Weekly',
  as_needed: 'As Needed',
  custom: 'Custom',
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem',
    maxWidth: 960,
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '0.75rem',
  },
  statsRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap' as const,
  },
  statCard: {
    flex: '1 1 140px',
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.25rem',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--accent-meds)',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-tertiary)',
    marginTop: '0.25rem',
  },
  scheduleCard: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.25rem',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: '1rem',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontWeight: 600,
    color: 'var(--text)',
    fontSize: '0.95rem',
  },
  scheduleDosage: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '0.15rem',
  },
  scheduleActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center' as const,
  },
  btnTake: {
    background: 'var(--accent-meds)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSkip: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  doseStatus: {
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.4rem 0.85rem',
    borderRadius: 'var(--radius-sm)',
  },
  doseTaken: {
    color: 'var(--accent-meds)',
  },
  doseSkipped: {
    color: 'var(--text-tertiary)',
  },
  medCard: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.25rem',
    marginBottom: '0.75rem',
  },
  medCardHeader: {
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: '0.5rem',
  },
  medName: {
    fontWeight: 600,
    color: 'var(--text)',
    fontSize: '0.95rem',
  },
  medDosage: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  badgeRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center' as const,
    marginTop: '0.35rem',
    flexWrap: 'wrap' as const,
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  badgeActive: {
    background: 'rgba(6, 182, 212, 0.12)',
    color: 'var(--accent-meds)',
    border: '1px solid rgba(6, 182, 212, 0.25)',
  },
  badgeInactive: {
    background: 'var(--surface)',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border)',
  },
  adherenceBar: {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center' as const,
    gap: '0.5rem',
  },
  adherenceTrack: {
    flex: 1,
    height: 6,
    background: 'var(--surface)',
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  adherenceFill: {
    height: '100%',
    background: 'var(--accent-meds)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  adherenceLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    minWidth: 40,
    textAlign: 'right' as const,
  },
  medActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  btnSmall: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.3rem 0.65rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  btnDanger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.3rem 0.65rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  form: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    marginBottom: '2rem',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  input: {
    flex: '1 1 180px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.85rem',
    color: 'var(--text)',
    outline: 'none',
  },
  select: {
    flex: '1 1 140px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.85rem',
    color: 'var(--text)',
    outline: 'none',
  },
  btnPrimary: {
    background: 'var(--accent-meds)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '0.5rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  editForm: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
  },
  editInput: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.35rem 0.6rem',
    fontSize: '0.8rem',
    color: 'var(--text)',
    outline: 'none',
    width: 120,
  },
  editSelect: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.35rem 0.6rem',
    fontSize: '0.8rem',
    color: 'var(--text)',
    outline: 'none',
    width: 120,
  },
  empty: {
    textAlign: 'center' as const,
    color: 'var(--text-tertiary)',
    padding: '2rem',
    fontSize: '0.9rem',
  },
};

export default function MedsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayDoses, setTodayDoses] = useState<Dose[]>([]);
  const [adherenceRates, setAdherenceRates] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add form
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editFrequency, setEditFrequency] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    try {
      const [meds, doses, count] = await Promise.all([
        fetchMedications(),
        fetchDosesForDate(today),
        fetchMedicationCount(),
      ]);
      setMedications(meds as Medication[]);
      setTodayDoses(doses as Dose[]);
      setTotalCount(count as number);

      const rates: Record<string, number> = {};
      for (const med of meds as Medication[]) {
        try {
          const rate = await fetchAdherenceRate(med.id, thirtyDaysAgo, today);
          rates[med.id] = rate as number;
        } catch {
          rates[med.id] = 0;
        }
      }
      setAdherenceRates(rates);
    } catch (err) {
      console.error('Failed to load meds data:', err);
    } finally {
      setLoading(false);
    }
  }, [today, thirtyDaysAgo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeMeds = medications.filter((m) => m.isActive);
  const dosesToday = todayDoses.filter((d) => !d.skipped).length;

  const getDoseForMed = useCallback(
    (medId: string) => todayDoses.find((d) => d.medicationId === medId),
    [todayDoses],
  );

  const handleAdd = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    await doCreateMedication(id, {
      name,
      dosage: newDosage.trim() || undefined,
      unit: newUnit.trim() || undefined,
      frequency: newFrequency || undefined,
    });
    setNewName('');
    setNewDosage('');
    setNewUnit('');
    setNewFrequency('daily');
    await loadData();
  }, [newName, newDosage, newUnit, newFrequency, loadData]);

  const handleTake = useCallback(
    async (medicationId: string) => {
      const id = crypto.randomUUID();
      const takenAt = new Date().toISOString();
      await doRecordDose(id, medicationId, takenAt, false);
      await loadData();
    },
    [loadData],
  );

  const handleSkip = useCallback(
    async (medicationId: string) => {
      const id = crypto.randomUUID();
      const takenAt = new Date().toISOString();
      await doRecordDose(id, medicationId, takenAt, true);
      await loadData();
    },
    [loadData],
  );

  const handleUndoDose = useCallback(
    async (doseId: string) => {
      await doDeleteDose(doseId);
      await loadData();
    },
    [loadData],
  );

  const startEdit = useCallback((med: Medication) => {
    setEditingId(med.id);
    setEditName(med.name);
    setEditDosage(med.dosage ?? '');
    setEditUnit(med.unit ?? '');
    setEditFrequency(med.frequency ?? 'daily');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    await doUpdateMedication(editingId, {
      name: editName.trim(),
      dosage: editDosage.trim(),
      unit: editUnit.trim(),
      frequency: editFrequency,
    });
    setEditingId(null);
    await loadData();
  }, [editingId, editName, editDosage, editUnit, editFrequency, loadData]);

  const handleToggleActive = useCallback(
    async (med: Medication) => {
      await doUpdateMedication(med.id, { isActive: !med.isActive });
      await loadData();
    },
    [loadData],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Delete this medication? This cannot be undone.')) return;
      await doDeleteMedication(id);
      await loadData();
    },
    [loadData],
  );

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.empty}>Loading medications...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Medications</h1>
        <p style={styles.subtitle}>Track your medications, doses, and adherence</p>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalCount}</div>
          <div style={styles.statLabel}>Total Medications</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{activeMeds.length}</div>
          <div style={styles.statLabel}>Active</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{dosesToday}</div>
          <div style={styles.statLabel}>Doses Taken Today</div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Today&apos;s Schedule</h2>
        {activeMeds.length === 0 ? (
          <div style={styles.empty}>No active medications to track.</div>
        ) : (
          activeMeds.map((med) => {
            const dose = getDoseForMed(med.id);
            return (
              <div key={med.id} style={styles.scheduleCard}>
                <div style={styles.scheduleInfo}>
                  <div style={styles.scheduleName}>{med.name}</div>
                  {(med.dosage || med.unit) && (
                    <div style={styles.scheduleDosage}>
                      {[med.dosage, med.unit].filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
                <div style={styles.scheduleActions}>
                  {dose ? (
                    <>
                      <span
                        style={{
                          ...styles.doseStatus,
                          ...(dose.skipped ? styles.doseSkipped : styles.doseTaken),
                        }}
                      >
                        {dose.skipped ? 'Skipped' : 'Taken'}
                      </span>
                      <button
                        style={styles.btnSmall}
                        onClick={() => handleUndoDose(dose.id)}
                      >
                        Undo
                      </button>
                    </>
                  ) : (
                    <>
                      <button style={styles.btnTake} onClick={() => handleTake(med.id)}>
                        Take
                      </button>
                      <button style={styles.btnSkip} onClick={() => handleSkip(med.id)}>
                        Skip
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Medication Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add Medication</h2>
        <div style={styles.form}>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="Medication name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Dosage (e.g. 500)"
              value={newDosage}
              onChange={(e) => setNewDosage(e.target.value)}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Unit (e.g. mg)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
            <select
              style={styles.select}
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as_needed">As Needed</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <button style={styles.btnPrimary} onClick={handleAdd}>
            Add Medication
          </button>
        </div>
      </div>

      {/* Medication List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>All Medications</h2>
        {medications.length === 0 ? (
          <div style={styles.empty}>
            No medications yet. Add one above to get started.
          </div>
        ) : (
          medications.map((med) => (
            <div key={med.id} style={styles.medCard}>
              <div style={styles.medCardHeader}>
                <div>
                  <div style={styles.medName}>{med.name}</div>
                  {(med.dosage || med.unit) && (
                    <div style={styles.medDosage}>
                      {[med.dosage, med.unit].filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>
                  {FREQUENCY_LABELS[med.frequency ?? 'daily'] ?? med.frequency}
                </span>
                <span
                  style={{
                    ...styles.badge,
                    ...(med.isActive ? styles.badgeActive : styles.badgeInactive),
                  }}
                >
                  {med.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Adherence */}
              <div style={styles.adherenceBar}>
                <div style={styles.adherenceTrack}>
                  <div
                    style={{
                      ...styles.adherenceFill,
                      width: `${adherenceRates[med.id] ?? 0}%`,
                    }}
                  />
                </div>
                <span style={styles.adherenceLabel}>
                  {Math.round(adherenceRates[med.id] ?? 0)}%
                </span>
              </div>

              {/* Edit form */}
              {editingId === med.id ? (
                <div style={styles.editForm}>
                  <input
                    style={styles.editInput}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    style={styles.editInput}
                    type="text"
                    value={editDosage}
                    onChange={(e) => setEditDosage(e.target.value)}
                    placeholder="Dosage"
                  />
                  <input
                    style={styles.editInput}
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="Unit"
                  />
                  <select
                    style={styles.editSelect}
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="as_needed">As Needed</option>
                    <option value="custom">Custom</option>
                  </select>
                  <button style={styles.btnPrimary} onClick={handleSaveEdit}>
                    Save
                  </button>
                  <button style={styles.btnSmall} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={styles.medActions}>
                  <button style={styles.btnSmall} onClick={() => startEdit(med)}>
                    Edit
                  </button>
                  <button
                    style={styles.btnSmall}
                    onClick={() => handleToggleActive(med)}
                  >
                    {med.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    style={styles.btnDanger}
                    onClick={() => handleDelete(med.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
