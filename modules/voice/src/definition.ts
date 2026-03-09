import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const VOICE_MODULE: ModuleDefinition = {
  id: 'voice',
  name: 'MyVoice',
  tagline: 'Private on-device dictation',
  icon: '\uD83C\uDF99\uFE0F',
  accentColor: '#EF4444',
  tier: 'free',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'vc_',
  migrations: [
    {
      version: 1,
      description: 'Create voice tables: transcriptions, voice notes, settings',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS vc_settings',
        'DROP TABLE IF EXISTS vc_voice_notes',
        'DROP TABLE IF EXISTS vc_transcriptions',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'dictate', label: 'Dictate', icon: 'mic' },
      { key: 'history', label: 'History', icon: 'clock' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'transcription-detail', title: 'Transcription' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
