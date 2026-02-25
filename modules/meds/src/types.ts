import { z } from 'zod';

// ── Frequency enum ──────────────────────────────────────────────────────────
export const MedFrequencySchema = z.enum([
  'daily',
  'twice_daily',
  'weekly',
  'as_needed',
  'custom',
]);
export type MedFrequency = z.infer<typeof MedFrequencySchema>;

// ── Medication ──────────────────────────────────────────────────────────────
export const MedicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dosage: z.string().nullable(),
  unit: z.string().nullable(),
  frequency: MedFrequencySchema,
  instructions: z.string().nullable(),
  prescriber: z.string().nullable(),
  pharmacy: z.string().nullable(),
  refillDate: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Medication = z.infer<typeof MedicationSchema>;

// ── Dose record ─────────────────────────────────────────────────────────────
export const DoseSchema = z.object({
  id: z.string(),
  medicationId: z.string(),
  takenAt: z.string(),
  skipped: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type Dose = z.infer<typeof DoseSchema>;
