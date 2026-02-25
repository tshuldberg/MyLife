import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../actions', () => ({
  fetchVehicles: vi.fn(),
  fetchVehicleCount: vi.fn(),
  doCreateVehicle: vi.fn(),
  doUpdateVehicle: vi.fn(),
  doDeleteVehicle: vi.fn(),
  fetchMaintenance: vi.fn(),
  doCreateMaintenance: vi.fn(),
  doDeleteMaintenance: vi.fn(),
  fetchFuelLogs: vi.fn(),
  doCreateFuelLog: vi.fn(),
  doDeleteFuelLog: vi.fn(),
}));

import CarPage from '../page';
import {
  fetchVehicles,
  fetchVehicleCount,
  doCreateVehicle,
  doDeleteVehicle,
  fetchMaintenance,
  doCreateMaintenance,
  fetchFuelLogs,
  doCreateFuelLog,
} from '../actions';

type Vehicle = {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  vin: string | null;
  licensePlate: string | null;
  odometer: number;
  fuelType: string;
  isPrimary: boolean;
  imageUri: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const mockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 'v-1',
  name: 'Daily Driver',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: null,
  vin: null,
  licensePlate: null,
  odometer: 35000,
  fuelType: 'gas',
  isPrimary: true,
  imageUri: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (doCreateVehicle as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  (doDeleteVehicle as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  (fetchMaintenance as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (doCreateMaintenance as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  (fetchFuelLogs as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (doCreateFuelLog as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
});

describe('CarPage', () => {
  it('loads and displays vehicles on mount', async () => {
    const vehicle = mockVehicle();
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([vehicle]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Driver')).toBeInTheDocument();
    });

    expect(screen.getByText('Garage')).toBeInTheDocument();
    expect(screen.getByText(/Toyota Camry 2022/)).toBeInTheDocument();
    expect(screen.getByText(/35,000/)).toBeInTheDocument();
    expect(fetchVehicles).toHaveBeenCalled();
    expect(fetchVehicleCount).toHaveBeenCalled();
  });

  it('creates a new vehicle via form', async () => {
    const user = userEvent.setup();
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Garage')).toBeInTheDocument();
    });

    // Form inputs use placeholder text
    await user.type(screen.getByPlaceholderText('Name'), 'My Tesla');
    await user.type(screen.getByPlaceholderText('Make'), 'Tesla');
    await user.type(screen.getByPlaceholderText('Model'), 'Model 3');
    await user.type(screen.getByPlaceholderText('Year'), '2024');

    const addButton = screen.getByRole('button', { name: /add vehicle/i });
    await user.click(addButton);

    await waitFor(() => {
      // doCreateVehicle(id, { name, make, model, year }) — two args
      expect(doCreateVehicle).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'My Tesla',
          make: 'Tesla',
          model: 'Model 3',
          year: 2024,
        })
      );
    });
  });

  it('selects a vehicle and loads maintenance/fuel logs', async () => {
    const user = userEvent.setup();
    const vehicle = mockVehicle();
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([vehicle]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Driver')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Daily Driver'));

    await waitFor(() => {
      // fetchMaintenance(vehicleId) — called with string, not object
      expect(fetchMaintenance).toHaveBeenCalledWith('v-1');
      expect(fetchFuelLogs).toHaveBeenCalledWith('v-1');
    });
  });

  it('adds maintenance record to selected vehicle', async () => {
    const user = userEvent.setup();
    const vehicle = mockVehicle();
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([vehicle]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Driver')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Daily Driver'));

    await waitFor(() => {
      expect(fetchMaintenance).toHaveBeenCalled();
    });

    // Maintenance form has a type select (default "oil_change") and a date input.
    const maintDateInput = document.querySelector('input[type="date"]') as HTMLInputElement | null;
    expect(maintDateInput).not.toBeNull();
    if (!maintDateInput) return;
    await user.type(maintDateInput, '2026-02-01');

    // Find the "Add" button in the maintenance section
    const addButtons = screen.getAllByRole('button', { name: /^add$/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      // doCreateMaintenance(id, vehicleId, { type, performedAt }) — three args
      expect(doCreateMaintenance).toHaveBeenCalledWith(
        expect.any(String),
        'v-1',
        expect.objectContaining({
          type: 'oil_change',
          performedAt: '2026-02-01',
        })
      );
    });
  });

  it('adds fuel log to selected vehicle', async () => {
    const user = userEvent.setup();
    const vehicle = mockVehicle();
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([vehicle]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Driver')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Daily Driver'));

    await waitFor(() => {
      expect(fetchFuelLogs).toHaveBeenCalled();
    });

    // Fuel log form uses placeholder text for inputs
    await user.type(screen.getByPlaceholderText('Gallons'), '12.5');
    await user.type(screen.getByPlaceholderText('Cost ($)'), '48.75');
    await user.type(screen.getByPlaceholderText('Odometer'), '35500');

    // Find the "Add" button in the fuel log section (second Add button)
    const addButtons = screen.getAllByRole('button', { name: /^add$/i });
    const fuelAddButton = addButtons[addButtons.length - 1];
    await user.click(fuelAddButton);

    await waitFor(() => {
      // doCreateFuelLog(id, vehicleId, { gallons, costCents, odometerAt, loggedAt, station }) — three args
      expect(doCreateFuelLog).toHaveBeenCalledWith(
        expect.any(String),
        'v-1',
        expect.objectContaining({
          gallons: 12.5,
          costCents: 4875,
          odometerAt: 35500,
        })
      );
    });
  });

  it('deletes a vehicle with confirmation', async () => {
    const user = userEvent.setup();
    const vehicle = mockVehicle();
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([vehicle]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Driver')).toBeInTheDocument();
    });

    // First click shows "Delete", second click shows "Confirm"
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(doDeleteVehicle).toHaveBeenCalledWith('v-1');
    });
  });

  it('shows empty state when no vehicles', async () => {
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Garage')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/no vehicles yet/i)
    ).toBeInTheDocument();
  });

  it('displays fuel type badge', async () => {
    const vehicle = mockVehicle({ fuelType: 'gas' });
    (fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([vehicle]);
    (fetchVehicleCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    render(<CarPage />);

    await waitFor(() => {
      expect(screen.getByText('Daily Driver')).toBeInTheDocument();
    });

    expect(screen.getByText(/gas/i)).toBeInTheDocument();
  });
});
