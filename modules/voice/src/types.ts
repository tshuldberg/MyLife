import { z } from 'zod';

// ── Transcription ─────────────────────────────────────────────────────

export const TranscriptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  durationSeconds: z.number(),
  language: z.string().nullable(),
  confidence: z.number().nullable(),
  audioUri: z.string().nullable(),
  createdAt: z.string(),
});
export type Transcription = z.infer<typeof TranscriptionSchema>;

// ── Voice Note ────────────────────────────────────────────────────────

export const VoiceNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  transcriptionId: z.string().nullable(),
  tags: z.string().nullable(),
  isFavorite: z.boolean(),
  createdAt: z.string(),
});
export type VoiceNote = z.infer<typeof VoiceNoteSchema>;

// ── Voice Setting ─────────────────────────────────────────────────────

export const VoiceSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type VoiceSetting = z.infer<typeof VoiceSettingSchema>;

// ── Transcription Stats ───────────────────────────────────────────────

export const TranscriptionStatsSchema = z.object({
  totalCount: z.number(),
  totalDurationSeconds: z.number(),
  avgDurationSeconds: z.number(),
  byLanguage: z.array(
    z.object({
      language: z.string(),
      count: z.number(),
    }),
  ),
});
export type TranscriptionStats = z.infer<typeof TranscriptionStatsSchema>;

// ── Voice Command ─────────────────────────────────────────────────────

export const VoiceCommandSchema = z.object({
  id: z.string(),
  phrase: z.string(),
  action: z.string(),
  isEnabled: z.boolean(),
});
export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;
