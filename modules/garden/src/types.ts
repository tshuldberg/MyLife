import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────

export const PlantLocationSchema = z.enum([
  'indoor',
  'outdoor',
  'greenhouse',
  'balcony',
]);
export type PlantLocation = z.infer<typeof PlantLocationSchema>;

export const PlantStatusSchema = z.enum([
  'healthy',
  'needs_attention',
  'dormant',
  'dead',
]);
export type PlantStatus = z.infer<typeof PlantStatusSchema>;

export const CareActionSchema = z.enum([
  'water',
  'fertilize',
  'prune',
  'repot',
  'harvest',
  'pest_treatment',
  'photo',
  'note',
]);
export type CareAction = z.infer<typeof CareActionSchema>;

export const SeasonSchema = z.enum(['spring', 'summer', 'fall', 'winter']);
export type Season = z.infer<typeof SeasonSchema>;

// ── Core Entities ──────────────────────────────────────────────────────

export const PlantSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string().nullable(),
  location: PlantLocationSchema,
  zone: z.string().nullable(),
  imageUri: z.string().nullable(),
  waterFrequencyDays: z.number().int().nullable(),
  lastWatered: z.string().nullable(),
  status: PlantStatusSchema,
  acquiredDate: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Plant = z.infer<typeof PlantSchema>;

export const GardenEntrySchema = z.object({
  id: z.string(),
  plantId: z.string().nullable(),
  date: z.string(),
  action: CareActionSchema,
  notes: z.string().nullable(),
  imageUri: z.string().nullable(),
  quantityGrams: z.number().nullable(),
  createdAt: z.string(),
});
export type GardenEntry = z.infer<typeof GardenEntrySchema>;

export const GardenZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: PlantLocationSchema,
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});
export type GardenZone = z.infer<typeof GardenZoneSchema>;

export const SeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string().nullable(),
  quantity: z.number().int(),
  source: z.string().nullable(),
  purchasedDate: z.string().nullable(),
  expiryDate: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type Seed = z.infer<typeof SeedSchema>;

export const GardenSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type GardenSetting = z.infer<typeof GardenSettingSchema>;

// ── Input Schemas ──────────────────────────────────────────────────────

export const CreatePlantInputSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().nullable().default(null),
  location: PlantLocationSchema.default('indoor'),
  zone: z.string().nullable().default(null),
  imageUri: z.string().nullable().default(null),
  waterFrequencyDays: z.number().int().min(1).nullable().default(null),
  status: PlantStatusSchema.default('healthy'),
  acquiredDate: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type CreatePlantInput = z.input<typeof CreatePlantInputSchema>;

export const UpdatePlantInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().nullable().optional(),
  location: PlantLocationSchema.optional(),
  zone: z.string().nullable().optional(),
  imageUri: z.string().nullable().optional(),
  waterFrequencyDays: z.number().int().min(1).nullable().optional(),
  lastWatered: z.string().nullable().optional(),
  status: PlantStatusSchema.optional(),
  acquiredDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type UpdatePlantInput = z.input<typeof UpdatePlantInputSchema>;

export const CreateEntryInputSchema = z.object({
  plantId: z.string().nullable().default(null),
  date: z.string().optional(),
  action: CareActionSchema,
  notes: z.string().nullable().default(null),
  imageUri: z.string().nullable().default(null),
  quantityGrams: z.number().nullable().default(null),
});
export type CreateEntryInput = z.input<typeof CreateEntryInputSchema>;

export const CreateZoneInputSchema = z.object({
  name: z.string().min(1).max(100),
  location: PlantLocationSchema.default('indoor'),
  description: z.string().nullable().default(null),
  sortOrder: z.number().int().default(0),
});
export type CreateZoneInput = z.input<typeof CreateZoneInputSchema>;

export const CreateSeedInputSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().nullable().default(null),
  quantity: z.number().int().min(0).default(0),
  source: z.string().nullable().default(null),
  purchasedDate: z.string().nullable().default(null),
  expiryDate: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type CreateSeedInput = z.input<typeof CreateSeedInputSchema>;

export const PlantFilterSchema = z.object({
  location: PlantLocationSchema.optional(),
  status: PlantStatusSchema.optional(),
  zone: z.string().nullable().optional(),
  needsWater: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
});
export type PlantFilter = z.input<typeof PlantFilterSchema>;

// ── Analytics Types ────────────────────────────────────────────────────

export interface GardenStats {
  totalPlants: number;
  healthyCount: number;
  needsAttentionCount: number;
  dormantCount: number;
  deadCount: number;
  totalHarvestGrams: number;
  totalEntries: number;
  overdueWateringCount: number;
}

export interface WateringScheduleItem {
  plantId: string;
  plantName: string;
  lastWatered: string | null;
  frequencyDays: number;
  nextWaterDate: string | null;
  isOverdue: boolean;
  daysOverdue: number;
}
