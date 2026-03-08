import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────

export const MoodLevelSchema = z.enum([
  'great',
  'good',
  'okay',
  'low',
  'awful',
]);
export type MoodLevel = z.infer<typeof MoodLevelSchema>;

export const MoodScoreDescriptors: Record<number, { label: string; level: MoodLevel }> = {
  1: { label: 'Awful', level: 'awful' },
  2: { label: 'Terrible', level: 'awful' },
  3: { label: 'Bad', level: 'low' },
  4: { label: 'Poor', level: 'low' },
  5: { label: 'Meh', level: 'okay' },
  6: { label: 'Okay', level: 'okay' },
  7: { label: 'Good', level: 'good' },
  8: { label: 'Great', level: 'good' },
  9: { label: 'Amazing', level: 'great' },
  10: { label: 'Incredible', level: 'great' },
};

// Plutchik primary emotions (8 primary x 3 intensity = 24 named emotions)
export const PlutchikEmotionSchema = z.enum([
  // Joy axis
  'ecstasy', 'joy', 'serenity',
  // Trust axis
  'admiration', 'trust', 'acceptance',
  // Fear axis
  'terror', 'fear', 'apprehension',
  // Surprise axis
  'amazement', 'surprise', 'distraction',
  // Sadness axis
  'grief', 'sadness', 'pensiveness',
  // Disgust axis
  'loathing', 'disgust', 'boredom',
  // Anger axis
  'rage', 'anger', 'annoyance',
  // Anticipation axis
  'vigilance', 'anticipation', 'interest',
]);
export type PlutchikEmotion = z.infer<typeof PlutchikEmotionSchema>;

// ── Core Entities ──────────────────────────────────────────────────────

export const MoodEntrySchema = z.object({
  id: z.string(),
  score: z.number().int().min(1).max(10),
  note: z.string().nullable(),
  loggedAt: z.string(),
  date: z.string(),
  createdAt: z.string(),
});
export type MoodEntry = z.infer<typeof MoodEntrySchema>;

export const MoodActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  category: z.string().nullable(),
  isDefault: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});
export type MoodActivity = z.infer<typeof MoodActivitySchema>;

export const MoodEmotionTagSchema = z.object({
  id: z.string(),
  entryId: z.string(),
  emotion: PlutchikEmotionSchema,
  intensity: z.number().int().min(1).max(3),
  createdAt: z.string(),
});
export type MoodEmotionTag = z.infer<typeof MoodEmotionTagSchema>;

export const MoodEntryActivitySchema = z.object({
  id: z.string(),
  entryId: z.string(),
  activityId: z.string(),
  createdAt: z.string(),
});
export type MoodEntryActivity = z.infer<typeof MoodEntryActivitySchema>;

export const MoodStreakSchema = z.object({
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  lastLogDate: z.string().nullable(),
});
export type MoodStreak = z.infer<typeof MoodStreakSchema>;

export const BreathingPatternSchema = z.enum([
  'box',       // 4-4-4-4
  '478',       // 4-7-8
  'relaxing',  // 4-2-6
]);
export type BreathingPattern = z.infer<typeof BreathingPatternSchema>;

export const BreathingSessionSchema = z.object({
  id: z.string(),
  pattern: BreathingPatternSchema,
  durationSeconds: z.number().int(),
  cyclesCompleted: z.number().int(),
  completedAt: z.string(),
  createdAt: z.string(),
});
export type BreathingSession = z.infer<typeof BreathingSessionSchema>;

export const MoodSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type MoodSetting = z.infer<typeof MoodSettingSchema>;

// ── Input Schemas ──────────────────────────────────────────────────────

export const CreateMoodEntryInputSchema = z.object({
  score: z.number().int().min(1).max(10),
  note: z.string().max(500).nullable().default(null),
  loggedAt: z.string().optional(),
  emotions: z.array(z.object({
    emotion: PlutchikEmotionSchema,
    intensity: z.number().int().min(1).max(3).default(2),
  })).default([]),
  activityIds: z.array(z.string()).default([]),
});
export type CreateMoodEntryInput = z.input<typeof CreateMoodEntryInputSchema>;

export const CreateActivityInputSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  sortOrder: z.number().int().default(0),
});
export type CreateActivityInput = z.input<typeof CreateActivityInputSchema>;

export const UpdateActivityInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateActivityInput = z.input<typeof UpdateActivityInputSchema>;

export const CreateBreathingSessionInputSchema = z.object({
  pattern: BreathingPatternSchema,
  durationSeconds: z.number().int().min(1),
  cyclesCompleted: z.number().int().min(0),
});
export type CreateBreathingSessionInput = z.input<typeof CreateBreathingSessionInputSchema>;

export const MoodEntryFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minScore: z.number().int().min(1).max(10).optional(),
  maxScore: z.number().int().min(1).max(10).optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});
export type MoodEntryFilter = z.input<typeof MoodEntryFilterSchema>;

// ── Analytics Types ────────────────────────────────────────────────────

export interface DailyAverage {
  date: string;
  average: number;
  count: number;
}

export interface MoodDashboard {
  todayEntries: number;
  todayAverage: number | null;
  weekAverage: number | null;
  monthAverage: number | null;
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
}

export interface ActivityCorrelation {
  activityId: string;
  activityName: string;
  entryCount: number;
  averageScore: number;
  pearsonR: number | null;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  average: number;
  high: number;
  low: number;
  entryCount: number;
  topActivities: { name: string; count: number }[];
  topEmotions: { emotion: string; count: number }[];
}

// ── Constants ──────────────────────────────────────────────────────────

export const BREATHING_PATTERNS: Record<BreathingPattern, { inhale: number; hold1: number; exhale: number; hold2: number; name: string }> = {
  box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: 'Box Breathing' },
  '478': { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: '4-7-8 Breathing' },
  relaxing: { inhale: 4, hold1: 2, exhale: 6, hold2: 0, name: 'Relaxing Breath' },
};

export const DEFAULT_ACTIVITIES: { name: string; icon: string; category: string }[] = [
  { name: 'Exercise', icon: 'dumbbell', category: 'health' },
  { name: 'Work', icon: 'briefcase', category: 'productivity' },
  { name: 'Social', icon: 'users', category: 'social' },
  { name: 'Family', icon: 'heart', category: 'social' },
  { name: 'Sleep', icon: 'moon', category: 'health' },
  { name: 'Outdoors', icon: 'sun', category: 'leisure' },
  { name: 'Reading', icon: 'book', category: 'leisure' },
  { name: 'Cooking', icon: 'chef-hat', category: 'leisure' },
  { name: 'Meditation', icon: 'flower', category: 'health' },
  { name: 'Music', icon: 'music', category: 'leisure' },
  { name: 'Travel', icon: 'plane', category: 'leisure' },
  { name: 'Shopping', icon: 'shopping-bag', category: 'other' },
  { name: 'Therapy', icon: 'message-circle', category: 'health' },
  { name: 'Date', icon: 'heart', category: 'social' },
  { name: 'Gaming', icon: 'gamepad', category: 'leisure' },
];
