import { z } from 'zod';

export const JournalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string().nullable(),
  body: z.string(),
  tags: z.array(z.string()),
  mood: z.string().nullable(),
  imageUris: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const JournalTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
});
export type JournalTag = z.infer<typeof JournalTagSchema>;
