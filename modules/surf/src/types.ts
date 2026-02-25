import { z } from 'zod';

export const SurfBreakTypeSchema = z.enum([
  'beach',
  'point',
  'reef',
  'river-mouth',
  'other',
]);
export type SurfBreakType = z.infer<typeof SurfBreakTypeSchema>;

export const SurfTideSchema = z.enum(['low', 'mid', 'high', 'all']);
export type SurfTide = z.infer<typeof SurfTideSchema>;

export const SurfSpotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  breakType: SurfBreakTypeSchema,
  waveHeightFt: z.number().nonnegative(),
  windKts: z.number().nonnegative(),
  tide: SurfTideSchema,
  swellDirection: z.string().min(1),
  isFavorite: z.boolean(),
  lastUpdated: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SurfSpot = z.infer<typeof SurfSpotSchema>;

export const SurfSessionSchema = z.object({
  id: z.string().min(1),
  spotId: z.string().min(1),
  sessionDate: z.string().datetime(),
  durationMin: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type SurfSession = z.infer<typeof SurfSessionSchema>;
