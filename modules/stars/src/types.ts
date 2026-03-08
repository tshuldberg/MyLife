import { z } from 'zod';

// ── Zodiac ────────────────────────────────────────────────────────────

export const ZodiacSignSchema = z.enum([
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);
export type ZodiacSign = z.infer<typeof ZodiacSignSchema>;

export const ZodiacElementSchema = z.enum(['fire', 'earth', 'air', 'water']);
export type ZodiacElement = z.infer<typeof ZodiacElementSchema>;

// ── Moon Phase ────────────────────────────────────────────────────────

export const MoonPhaseSchema = z.enum([
  'new_moon',
  'waxing_crescent',
  'first_quarter',
  'waxing_gibbous',
  'full_moon',
  'waning_gibbous',
  'last_quarter',
  'waning_crescent',
]);
export type MoonPhase = z.infer<typeof MoonPhaseSchema>;

// ── Aspect ────────────────────────────────────────────────────────────

export const AspectSchema = z.enum([
  'conjunction',
  'sextile',
  'square',
  'trine',
  'opposition',
]);
export type Aspect = z.infer<typeof AspectSchema>;

// ── Tarot ─────────────────────────────────────────────────────────────

export const TarotCardSchema = z.object({
  name: z.string(),
  number: z.number(),
  suit: z.string().nullable(),
});
export type TarotCard = z.infer<typeof TarotCardSchema>;

// ── Birth Profile ─────────────────────────────────────────────────────

export const BirthProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthDate: z.string(),
  birthTime: z.string().nullable(),
  birthLat: z.number().nullable(),
  birthLng: z.number().nullable(),
  birthPlace: z.string().nullable(),
  sunSign: ZodiacSignSchema.nullable(),
  moonSign: ZodiacSignSchema.nullable(),
  risingSign: ZodiacSignSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BirthProfile = z.infer<typeof BirthProfileSchema>;

export const CreateBirthProfileInputSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string(),
  birthTime: z.string().nullable().optional(),
  birthLat: z.number().nullable().optional(),
  birthLng: z.number().nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  sunSign: ZodiacSignSchema.nullable().optional(),
  moonSign: ZodiacSignSchema.nullable().optional(),
  risingSign: ZodiacSignSchema.nullable().optional(),
});
export type CreateBirthProfileInput = z.infer<typeof CreateBirthProfileInputSchema>;

export const UpdateBirthProfileInputSchema = z.object({
  name: z.string().min(1).optional(),
  birthDate: z.string().optional(),
  birthTime: z.string().nullable().optional(),
  birthLat: z.number().nullable().optional(),
  birthLng: z.number().nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  sunSign: ZodiacSignSchema.nullable().optional(),
  moonSign: ZodiacSignSchema.nullable().optional(),
  risingSign: ZodiacSignSchema.nullable().optional(),
});
export type UpdateBirthProfileInput = z.infer<typeof UpdateBirthProfileInputSchema>;

// ── Transit ───────────────────────────────────────────────────────────

export const TransitSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  date: z.string(),
  planet: z.string(),
  sign: ZodiacSignSchema,
  aspect: z.string().nullable(),
  description: z.string().nullable(),
});
export type Transit = z.infer<typeof TransitSchema>;

export const CreateTransitInputSchema = z.object({
  profileId: z.string(),
  date: z.string(),
  planet: z.string(),
  sign: ZodiacSignSchema,
  aspect: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type CreateTransitInput = z.infer<typeof CreateTransitInputSchema>;

// ── Daily Reading ─────────────────────────────────────────────────────

export const DailyReadingSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  date: z.string(),
  moonPhase: MoonPhaseSchema,
  moonSign: ZodiacSignSchema.nullable(),
  summary: z.string().nullable(),
  tarotCard: z.string().nullable(),
  createdAt: z.string(),
});
export type DailyReading = z.infer<typeof DailyReadingSchema>;

export const CreateDailyReadingInputSchema = z.object({
  profileId: z.string(),
  date: z.string(),
  moonPhase: MoonPhaseSchema,
  moonSign: ZodiacSignSchema.nullable().optional(),
  summary: z.string().nullable().optional(),
  tarotCard: z.string().nullable().optional(),
});
export type CreateDailyReadingInput = z.infer<typeof CreateDailyReadingInputSchema>;

// ── Saved Chart ───────────────────────────────────────────────────────

export const SavedChartSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  chartType: z.string(),
  title: z.string(),
  data: z.string(),
  createdAt: z.string(),
});
export type SavedChart = z.infer<typeof SavedChartSchema>;

// ── Compatibility Result ──────────────────────────────────────────────

export const CompatibilityResultSchema = z.object({
  sign1: ZodiacSignSchema,
  sign2: ZodiacSignSchema,
  score: z.number().min(0).max(100),
  element1: ZodiacElementSchema,
  element2: ZodiacElementSchema,
  description: z.string(),
});
export type CompatibilityResult = z.infer<typeof CompatibilityResultSchema>;

// ── Stats ─────────────────────────────────────────────────────────────

export const StarsStatsSchema = z.object({
  totalProfiles: z.number(),
  totalTransits: z.number(),
  totalReadings: z.number(),
  totalSavedCharts: z.number(),
  currentMoonPhase: MoonPhaseSchema.nullable(),
});
export type StarsStats = z.infer<typeof StarsStatsSchema>;
