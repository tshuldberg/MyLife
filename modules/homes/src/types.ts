import { z } from 'zod';

export const HomeListingStatusSchema = z.enum([
  'new',
  'touring',
  'offer',
  'under_contract',
  'closed',
]);
export type HomeListingStatus = z.infer<typeof HomeListingStatusSchema>;

export const HomeListingSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  priceCents: z.number().int().nonnegative(),
  bedrooms: z.number().nonnegative(),
  bathrooms: z.number().nonnegative(),
  sqft: z.number().int().positive(),
  status: HomeListingStatusSchema,
  isSaved: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type HomeListing = z.infer<typeof HomeListingSchema>;

export const HomeTourSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  tourAt: z.string().datetime(),
  agentName: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type HomeTour = z.infer<typeof HomeTourSchema>;

export interface HomeMarketMetrics {
  listings: number;
  savedListings: number;
  averagePriceCents: number;
  averagePricePerSqft: number;
}
