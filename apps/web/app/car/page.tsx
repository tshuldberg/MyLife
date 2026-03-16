'use client';

import { useEffect, useState } from 'react';
import type { Vehicle, Maintenance, FuelLog } from '@mylife/car';
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

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CarPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Add vehicle form
  const [newName, setNewName] = useState('');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('');

  // Maintenance form
  const [maintType, setMaintType] = useState('oil_change');
  const [maintDate, setMaintDate] = useState('');

  // Fuel log form
  const [fuelGallons, setFuelGallons] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [vs, count] = await Promise.all([fetchVehicles(), fetchVehicleCount()]);
    setVehicles(vs as Vehicle[]);
    setVehicleCount(count as number);
    setLoading(false);
  }

  async function selectVehicle(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    const [maint, fuel] = await Promise.all([
      fetchMaintenance(vehicle.id),
      fetchFuelLogs(vehicle.id),
    ]);
    setMaintenance(maint as Maintenance[]);
    setFuelLogs(fuel as FuelLog[]);
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    const id = generateId();
    await doCreateVehicle(id, {
      name: newName,
      make: newMake,
      model: newModel,
      year: parseInt(newYear, 10),
    });
    setNewName('');
    setNewMake('');
    setNewModel('');
    setNewYear('');
    await load();
  }

  async function handleDeleteVehicle(id: string) {
    if (pendingDelete === id) {
      await doDeleteVehicle(id);
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      setPendingDelete(null);
      await load();
    } else {
      setPendingDelete(id);
    }
  }

  async function handleAddMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    const id = generateId();
    await doCreateMaintenance(id, selectedVehicle.id, { type: maintType, performedAt: maintDate });
    setMaintDate('');
    const maint = await fetchMaintenance(selectedVehicle.id);
    setMaintenance(maint as Maintenance[]);
  }

  async function handleAddFuelLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    const id = generateId();
    await doCreateFuelLog(id, selectedVehicle.id, {
      gallons: parseFloat(fuelGallons),
      costCents: Math.round(parseFloat(fuelCost) * 100),
      odometerAt: parseInt(fuelOdometer, 10),
      loggedAt: new Date().toISOString().slice(0, 10),
    });
    setFuelGallons('');
    setFuelCost('');
    setFuelOdometer('');
    const fuel = await fetchFuelLogs(selectedVehicle.id);
    setFuelLogs(fuel as FuelLog[]);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Garage</h1>
      <p>{vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''}</p>

      <form onSubmit={handleAddVehicle}>
        <input
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <input
          placeholder="Make"
          value={newMake}
          onChange={(e) => setNewMake(e.target.value)}
          required
        />
        <input
          placeholder="Model"
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          required
        />
        <input
          placeholder="Year"
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          required
        />
        <button type="submit">Add Vehicle</button>
      </form>

      {vehicles.length === 0 && <p>No vehicles yet</p>}

      <ul>
        {vehicles.map((v) => (
          <li key={v.id}>
            <button type="button" onClick={() => selectVehicle(v)}>
              {v.name}
            </button>
            <span> &mdash; {v.make} {v.model} {v.year}</span>
            <span> &mdash; {v.odometer.toLocaleString()} mi</span>
            <span> &mdash; {v.fuelType}</span>
            {pendingDelete === v.id ? (
              <button type="button" onClick={() => handleDeleteVehicle(v.id)}>Confirm</button>
            ) : (
              <button type="button" onClick={() => handleDeleteVehicle(v.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>

      {selectedVehicle && (
        <div>
          <h2>{selectedVehicle.name} Details</h2>

          <h3>Maintenance</h3>
          <form onSubmit={handleAddMaintenance}>
            <select value={maintType} onChange={(e) => setMaintType(e.target.value)}>
              <option value="oil_change">Oil Change</option>
              <option value="tire_rotation">Tire Rotation</option>
              <option value="brake_service">Brake Service</option>
              <option value="inspection">Inspection</option>
            </select>
            <input
              type="date"
              value={maintDate}
              onChange={(e) => setMaintDate(e.target.value)}
              required
            />
            <button type="submit">Add</button>
          </form>
          <ul>
            {maintenance.map((m) => (
              <li key={m.id}>{m.type} on {m.performedAt}</li>
            ))}
          </ul>

          <h3>Fuel Logs</h3>
          <form onSubmit={handleAddFuelLog}>
            <input
              placeholder="Gallons"
              value={fuelGallons}
              onChange={(e) => setFuelGallons(e.target.value)}
              required
            />
            <input
              placeholder="Cost ($)"
              value={fuelCost}
              onChange={(e) => setFuelCost(e.target.value)}
              required
            />
            <input
              placeholder="Odometer"
              value={fuelOdometer}
              onChange={(e) => setFuelOdometer(e.target.value)}
              required
            />
            <button type="submit">Add</button>
          </form>
          <ul>
            {fuelLogs.map((f) => (
              <li key={f.id}>{f.gallons}gal @ ${(f.costCents / 100).toFixed(2)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
