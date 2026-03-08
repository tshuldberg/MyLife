import { z } from 'zod';

export const PetSpeciesSchema = z.enum([
  'dog',
  'cat',
  'bird',
  'fish',
  'reptile',
  'small_mammal',
  'other',
]);
export type PetSpecies = z.infer<typeof PetSpeciesSchema>;

export const PetSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: PetSpeciesSchema,
  breed: z.string().nullable(),
  birthDate: z.string().nullable(),
  weightGrams: z.number().int().nullable(),
  imageUri: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Pet = z.infer<typeof PetSchema>;

export const VetVisitSchema = z.object({
  id: z.string(),
  petId: z.string(),
  date: z.string(),
  reason: z.string(),
  veterinarian: z.string().nullable(),
  costCents: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type VetVisit = z.infer<typeof VetVisitSchema>;

export const VaccinationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  name: z.string(),
  dateGiven: z.string(),
  nextDueDate: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type Vaccination = z.infer<typeof VaccinationSchema>;
