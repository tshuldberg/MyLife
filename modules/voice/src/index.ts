// Definition
export { VOICE_MODULE } from './definition';

// Types and schemas
export type {
  Transcription,
  VoiceNote,
  VoiceSetting,
  TranscriptionStats,
  VoiceCommand,
} from './types';

export {
  TranscriptionSchema,
  VoiceNoteSchema,
  VoiceSettingSchema,
  TranscriptionStatsSchema,
  VoiceCommandSchema,
} from './types';

// CRUD
export {
  createTranscription,
  getTranscription,
  getTranscriptions,
  deleteTranscription,
  createVoiceNote,
  getVoiceNote,
  getVoiceNotes,
  updateVoiceNote,
  deleteVoiceNote,
  toggleFavorite,
  setSetting,
  getSetting,
  getSettings,
  getTranscriptionStats,
} from './db/crud';

// Schema DDL
export {
  ALL_TABLES,
  CREATE_TRANSCRIPTIONS,
  CREATE_VOICE_NOTES,
  CREATE_VOICE_SETTINGS,
  CREATE_INDEXES,
} from './db/schema';

// Engine
export {
  calculateWordCount,
  calculateReadingTime,
  extractKeywords,
  summarizeText,
  formatDuration,
} from './engine/text';
