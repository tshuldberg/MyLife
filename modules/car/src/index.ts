export { CAR_MODULE } from './definition';
export type { Vehicle, FuelType, Maintenance, MaintenanceType, FuelLog } from './types';
export { VehicleSchema, FuelTypeSchema, MaintenanceSchema, MaintenanceTypeSchema, FuelLogSchema } from './types';
export {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  countVehicles,
  createMaintenance,
  getMaintenanceByVehicle,
  deleteMaintenance,
  createFuelLog,
  getFuelLogsByVehicle,
  deleteFuelLog,
  getSetting,
  setSetting,
} from './db';
