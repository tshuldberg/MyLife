// Definition
export { GARDEN_MODULE } from './definition';

// Types and schemas
export type {
  PlantLocation,
  PlantStatus,
  CareAction,
  Season,
  Plant,
  GardenEntry,
  GardenZone,
  Seed,
  GardenSetting,
  CreatePlantInput,
  UpdatePlantInput,
  CreateEntryInput,
  CreateZoneInput,
  CreateSeedInput,
  PlantFilter,
  GardenStats,
  WateringScheduleItem,
} from './types';

export {
  PlantLocationSchema,
  PlantStatusSchema,
  CareActionSchema,
  SeasonSchema,
  PlantSchema,
  GardenEntrySchema,
  GardenZoneSchema,
  SeedSchema,
  GardenSettingSchema,
  CreatePlantInputSchema,
  UpdatePlantInputSchema,
  CreateEntryInputSchema,
  CreateZoneInputSchema,
  CreateSeedInputSchema,
  PlantFilterSchema,
} from './types';

// CRUD
export {
  createPlant,
  getPlantById,
  getPlants,
  updatePlant,
  deletePlant,
  getPlantCount,
  waterPlant,
  createEntry,
  getEntriesForPlant,
  getEntriesByDate,
  deleteEntry,
  createZone,
  getZones,
  deleteZone,
  createSeed,
  getSeeds,
  updateSeedQuantity,
  deleteSeed,
  getSetting,
  setSetting,
  getGardenStats,
  getWateringSchedule,
} from './db/crud';

// Engine
export {
  calculateNextWaterDate,
  isDaysOverdue,
  getSeason,
  adjustFrequencyForSeason,
  calculateSurvivalRate,
  calculateGDD,
} from './engine/watering';
