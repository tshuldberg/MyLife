import { z } from 'zod';

export const ClothingCategorySchema = z.enum([
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'activewear',
  'swimwear',
  'sleepwear',
  'underwear',
  'other',
]);
export type ClothingCategory = z.infer<typeof ClothingCategorySchema>;

export const ClothingStatusSchema = z.enum(['active', 'stored', 'donated', 'sold', 'archived']);
export type ClothingStatus = z.infer<typeof ClothingStatusSchema>;

export const ClothingConditionSchema = z.enum(['new', 'good', 'fair', 'worn_out']);
export type ClothingCondition = z.infer<typeof ClothingConditionSchema>;

export const LaundryStatusSchema = z.enum(['clean', 'dirty', 'washing']);
export type LaundryStatus = z.infer<typeof LaundryStatusSchema>;

export const ClothingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ClothingCategorySchema,
  color: z.string().nullable(),
  brand: z.string().nullable(),
  purchasePriceCents: z.number().int().nullable(),
  purchaseDate: z.string().nullable(),
  imageUri: z.string().nullable(),
  seasons: z.array(z.string()),
  occasions: z.array(z.string()),
  condition: ClothingConditionSchema,
  status: ClothingStatusSchema,
  laundryStatus: LaundryStatusSchema,
  timesWorn: z.number().int(),
  lastWornDate: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ClothingItem = z.infer<typeof ClothingItemSchema>;

export const OutfitSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemIds: z.array(z.string()),
  occasion: z.string().nullable(),
  season: z.string().nullable(),
  imageUri: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Outfit = z.infer<typeof OutfitSchema>;

export const WearLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  outfitId: z.string().nullable(),
  itemIds: z.array(z.string()),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type WearLog = z.infer<typeof WearLogSchema>;

export const ClosetTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  usageCount: z.number().int(),
  createdAt: z.string(),
});
export type ClosetTag = z.infer<typeof ClosetTagSchema>;

export const ClosetSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type ClosetSetting = z.infer<typeof ClosetSettingSchema>;

export const ClosetDashboardSchema = z.object({
  totalItems: z.number().int(),
  totalOutfits: z.number().int(),
  wardrobeValueCents: z.number().int(),
  itemsWorn30Days: z.number().int(),
  donationCandidateCount: z.number().int(),
});
export type ClosetDashboard = z.infer<typeof ClosetDashboardSchema>;

export const CreateClothingItemInputSchema = z.object({
  name: z.string().min(1),
  category: ClothingCategorySchema,
  color: z.string().nullable().default(null),
  brand: z.string().nullable().default(null),
  purchasePriceCents: z.number().int().nullable().default(null),
  purchaseDate: z.string().nullable().default(null),
  imageUri: z.string().nullable().default(null),
  seasons: z.array(z.string()).default(['all-season']),
  occasions: z.array(z.string()).default([]),
  condition: ClothingConditionSchema.default('good'),
  status: ClothingStatusSchema.default('active'),
  laundryStatus: LaundryStatusSchema.default('clean'),
  notes: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
});
export type CreateClothingItemInput = z.input<typeof CreateClothingItemInputSchema>;

export const UpdateClothingItemInputSchema = z.object({
  name: z.string().min(1).optional(),
  category: ClothingCategorySchema.optional(),
  color: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  purchasePriceCents: z.number().int().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  imageUri: z.string().nullable().optional(),
  seasons: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  condition: ClothingConditionSchema.optional(),
  status: ClothingStatusSchema.optional(),
  laundryStatus: LaundryStatusSchema.optional(),
  timesWorn: z.number().int().min(0).optional(),
  lastWornDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type UpdateClothingItemInput = z.input<typeof UpdateClothingItemInputSchema>;

export const ClothingItemFilterSchema = z.object({
  category: ClothingCategorySchema.optional(),
  tag: z.string().optional(),
  status: ClothingStatusSchema.optional(),
  limit: z.number().int().min(1).max(500).default(100),
});
export type ClothingItemFilter = z.input<typeof ClothingItemFilterSchema>;

export const CreateOutfitInputSchema = z.object({
  name: z.string().min(1),
  itemIds: z.array(z.string()).min(1),
  occasion: z.string().nullable().default(null),
  season: z.string().nullable().default(null),
  imageUri: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type CreateOutfitInput = z.input<typeof CreateOutfitInputSchema>;

export const CreateWearLogInputSchema = z.object({
  date: z.string().optional(),
  outfitId: z.string().nullable().default(null),
  itemIds: z.array(z.string()).default([]),
  notes: z.string().nullable().default(null),
});
export type CreateWearLogInput = z.input<typeof CreateWearLogInputSchema>;
