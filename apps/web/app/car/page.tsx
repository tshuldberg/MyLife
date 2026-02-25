'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  fetchVehicles,
  fetchVehicleCount,
  doCreateVehicle,
  doUpdateVehicle,
  doDeleteVehicle,
  fetchMaintenance,
  doCreateMaintenance,
  doDeleteMaintenance,
  fetchFuelLogs,
  doCreateFuelLog,
  doDeleteFuelLog,
} from './actions';

/* ── Types ── */

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  vin: string | null;
  licensePlate: string | null;
  odometer: number | null;
  fuelType: 'gas' | 'diesel' | 'electric' | 'hybrid';
  isPrimary: boolean;
  imageUri: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  type: string;
  description: string | null;
  costCents: number | null;
  odometerAt: number | null;
  performedAt: string;
  nextDueDate: string | null;
  nextDueOdometer: number | null;
  notes: string | null;
  createdAt: string;
}

interface FuelLog {
  id: string;
  vehicleId: string;
  gallons: number;
  costCents: number;
  odometerAt: number;
  station: string | null;
  isFullTank: boolean;
  loggedAt: string;
  createdAt: string;
}

/* ── Styles ── */

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
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
  },
  cardElevated: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
  },
  cardLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  cardValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--accent-car)',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '0.75rem',
  },
  formRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  input: {
    flex: 1,
    minWidth: 120,
    padding: '0.5rem 0.75rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '0.875rem',
  },
  select: {
    flex: 1,
    minWidth: 120,
    padding: '0.5rem 0.75rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '0.875rem',
  },
  btnPrimary: {
    padding: '0.5rem 1rem',
    background: 'var(--accent-car)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '0.4rem 0.75rem',
    background: 'var(--danger)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '0.4rem 0.75rem',
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  vehicleList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  vehicleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },
  vehicleRowSelected: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: 'var(--surface-elevated)',
    border: '2px solid var(--accent-car)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  },
  vehicleName: {
    fontWeight: 600,
    color: 'var(--text)',
    fontSize: '0.9375rem',
  },
  vehicleMeta: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },
  badge: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    background: 'var(--accent-car)',
    color: '#fff',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  detailSection: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border)',
  },
  listItemText: {
    fontSize: '0.875rem',
    color: 'var(--text)',
  },
  listItemSub: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: 'var(--text-tertiary)',
    fontSize: '0.875rem',
  },
};

/* ── Helpers ── */

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const MAINTENANCE_TYPES = [
  'oil_change',
  'tire_rotation',
  'brakes',
  'battery',
  'inspection',
  'wash',
  'other',
] as const;

function formatMaintenanceType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ── Component ── */

export default function CarPage() {
  /* ── State ── */
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add vehicle form
  const [newName, setNewName] = useState('');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('');

  // Add maintenance form
  const [maintType, setMaintType] = useState<string>('oil_change');
  const [maintDate, setMaintDate] = useState('');

  // Add fuel log form
  const [fuelGallons, setFuelGallons] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');
  const [fuelStation, setFuelStation] = useState('');

  /* ── Data Loading ── */

  const loadVehicles = useCallback(async () => {
    const [list, count] = await Promise.all([
      fetchVehicles(),
      fetchVehicleCount(),
    ]);
    setVehicles(list as Vehicle[]);
    setVehicleCount(count);
  }, []);

  const loadVehicleDetail = useCallback(async (vehicleId: string) => {
    const [maint, fuel] = await Promise.all([
      fetchMaintenance(vehicleId),
      fetchFuelLogs(vehicleId),
    ]);
    setMaintenance(maint as Maintenance[]);
    setFuelLogs(fuel as FuelLog[]);
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (selectedId) {
      loadVehicleDetail(selectedId);
    } else {
      setMaintenance([]);
      setFuelLogs([]);
    }
  }, [selectedId, loadVehicleDetail]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;

  /* ── Handlers ── */

  const handleAddVehicle = useCallback(async () => {
    const name = newName.trim();
    const make = newMake.trim();
    const model = newModel.trim();
    const year = parseInt(newYear, 10);
    if (!name || !make || !model || isNaN(year)) return;

    const id = crypto.randomUUID();
    await doCreateVehicle(id, { name, make, model, year });
    setNewName('');
    setNewMake('');
    setNewModel('');
    setNewYear('');
    await loadVehicles();
  }, [newName, newMake, newModel, newYear, loadVehicles]);

  const handleDeleteVehicle = useCallback(
    async (id: string) => {
      if (confirmDeleteId !== id) {
        setConfirmDeleteId(id);
        return;
      }
      await doDeleteVehicle(id);
      setConfirmDeleteId(null);
      if (selectedId === id) setSelectedId(null);
      await loadVehicles();
    },
    [confirmDeleteId, selectedId, loadVehicles],
  );

  const handleAddMaintenance = useCallback(async () => {
    if (!selectedId || !maintDate) return;
    const id = crypto.randomUUID();
    await doCreateMaintenance(id, selectedId, {
      type: maintType,
      performedAt: maintDate,
    });
    setMaintType('oil_change');
    setMaintDate('');
    await loadVehicleDetail(selectedId);
  }, [selectedId, maintType, maintDate, loadVehicleDetail]);

  const handleDeleteMaintenance = useCallback(
    async (id: string) => {
      await doDeleteMaintenance(id);
      if (selectedId) await loadVehicleDetail(selectedId);
    },
    [selectedId, loadVehicleDetail],
  );

  const handleAddFuelLog = useCallback(async () => {
    if (!selectedId) return;
    const gallons = parseFloat(fuelGallons);
    const costDollars = parseFloat(fuelCost);
    const odometerAt = parseInt(fuelOdometer, 10);
    if (isNaN(gallons) || isNaN(costDollars) || isNaN(odometerAt)) return;

    const id = crypto.randomUUID();
    const costCents = Math.round(costDollars * 100);
    await doCreateFuelLog(id, selectedId, {
      gallons,
      costCents,
      odometerAt,
      loggedAt: new Date().toISOString(),
      station: fuelStation.trim() || undefined,
    });
    setFuelGallons('');
    setFuelCost('');
    setFuelOdometer('');
    setFuelStation('');
    if (selectedId) await loadVehicleDetail(selectedId);
  }, [selectedId, fuelGallons, fuelCost, fuelOdometer, fuelStation, loadVehicleDetail]);

  const handleDeleteFuelLog = useCallback(
    async (id: string) => {
      await doDeleteFuelLog(id);
      if (selectedId) await loadVehicleDetail(selectedId);
    },
    [selectedId, loadVehicleDetail],
  );

  /* ── Render ── */

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Garage</h1>
        <div style={styles.subtitle}>
          {vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''} tracked
        </div>
      </div>

      {/* Summary + Add Vehicle */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Vehicles</div>
          <div style={styles.cardValue}>{vehicleCount}</div>
        </div>

        <div style={styles.cardElevated}>
          <div style={styles.sectionTitle}>Add Vehicle</div>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Make"
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
            />
          </div>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              placeholder="Model"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Year"
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
            />
          </div>
          <button style={styles.btnPrimary} onClick={handleAddVehicle}>
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle List */}
      <div style={styles.sectionTitle}>Vehicles</div>
      {vehicles.length === 0 ? (
        <div style={styles.emptyState}>
          No vehicles yet. Add your first vehicle above.
        </div>
      ) : (
        <div style={styles.vehicleList}>
          {vehicles.map((v) => (
            <div
              key={v.id}
              style={
                selectedId === v.id
                  ? styles.vehicleRowSelected
                  : styles.vehicleRow
              }
              onClick={() =>
                setSelectedId(selectedId === v.id ? null : v.id)
              }
            >
              <div>
                <div style={styles.vehicleName}>{v.name}</div>
                <div style={styles.vehicleMeta}>
                  {v.make} {v.model} {v.year}
                  {v.odometer != null && ` \u00B7 ${v.odometer.toLocaleString()} mi`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={styles.badge}>{v.fuelType}</span>
                <button
                  style={
                    confirmDeleteId === v.id
                      ? styles.btnDanger
                      : styles.btnGhost
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVehicle(v.id);
                  }}
                >
                  {confirmDeleteId === v.id ? 'Confirm' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Vehicle Detail */}
      {selectedVehicle && (
        <>
          {/* Maintenance History */}
          <div style={styles.detailSection}>
            <div style={styles.sectionTitle}>
              Maintenance \u2014 {selectedVehicle.name}
            </div>

            {/* Quick-add maintenance */}
            <div style={styles.formRow}>
              <select
                style={styles.select}
                value={maintType}
                onChange={(e) => setMaintType(e.target.value)}
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatMaintenanceType(t)}
                  </option>
                ))}
              </select>
              <input
                style={styles.input}
                type="date"
                value={maintDate}
                onChange={(e) => setMaintDate(e.target.value)}
              />
              <button style={styles.btnPrimary} onClick={handleAddMaintenance}>
                Add
              </button>
            </div>

            {maintenance.length === 0 ? (
              <div style={styles.emptyState}>No maintenance records yet.</div>
            ) : (
              maintenance.map((m) => (
                <div key={m.id} style={styles.listItem}>
                  <div>
                    <div style={styles.listItemText}>
                      {formatMaintenanceType(m.type)}
                    </div>
                    <div style={styles.listItemSub}>
                      {m.performedAt}
                      {m.costCents != null && ` \u00B7 ${formatCurrency(m.costCents)}`}
                      {m.odometerAt != null &&
                        ` \u00B7 ${m.odometerAt.toLocaleString()} mi`}
                    </div>
                  </div>
                  <button
                    style={styles.btnGhost}
                    onClick={() => handleDeleteMaintenance(m.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Fuel Logs */}
          <div style={styles.detailSection}>
            <div style={styles.sectionTitle}>
              Fuel Log \u2014 {selectedVehicle.name}
            </div>

            {/* Quick-add fuel log */}
            <div style={styles.formRow}>
              <input
                style={styles.input}
                placeholder="Gallons"
                type="number"
                step="0.001"
                value={fuelGallons}
                onChange={(e) => setFuelGallons(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Cost ($)"
                type="number"
                step="0.01"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Odometer"
                type="number"
                value={fuelOdometer}
                onChange={(e) => setFuelOdometer(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Station (optional)"
                value={fuelStation}
                onChange={(e) => setFuelStation(e.target.value)}
              />
              <button style={styles.btnPrimary} onClick={handleAddFuelLog}>
                Add
              </button>
            </div>

            {fuelLogs.length === 0 ? (
              <div style={styles.emptyState}>No fuel logs yet.</div>
            ) : (
              fuelLogs.map((f) => (
                <div key={f.id} style={styles.listItem}>
                  <div>
                    <div style={styles.listItemText}>
                      {f.gallons.toFixed(3)} gal \u00B7{' '}
                      {formatCurrency(f.costCents)} \u00B7{' '}
                      {f.odometerAt.toLocaleString()} mi
                    </div>
                    <div style={styles.listItemSub}>
                      {f.loggedAt.slice(0, 10)}
                      {f.station && ` \u00B7 ${f.station}`}
                      {f.isFullTank && ' \u00B7 Full tank'}
                    </div>
                  </div>
                  <button
                    style={styles.btnGhost}
                    onClick={() => handleDeleteFuelLog(f.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
