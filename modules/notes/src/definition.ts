import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, FTS_STATEMENTS, CREATE_INDEXES } from './db/schema';

export const NOTES_MODULE: ModuleDefinition = {
  id: 'notes',
  name: 'MyNotes',
  tagline: 'Plain markdown notes, no lock-in',
  icon: '📝',
  accentColor: '#64748B',
  tier: 'free',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'nt_',
  migrations: [
    {
      version: 1,
      description: 'Create notes tables: folders, notes, tags, note-tags, links, templates, settings + FTS5 index',
      up: [...ALL_TABLES, ...FTS_STATEMENTS, ...CREATE_INDEXES],
      down: [
        'DROP TRIGGER IF EXISTS nt_notes_fts_update',
        'DROP TRIGGER IF EXISTS nt_notes_fts_delete',
        'DROP TRIGGER IF EXISTS nt_notes_fts_insert',
        'DROP TABLE IF EXISTS nt_notes_fts',
        'DROP TABLE IF EXISTS nt_settings',
        'DROP TABLE IF EXISTS nt_templates',
        'DROP TABLE IF EXISTS nt_note_links',
        'DROP TABLE IF EXISTS nt_note_tags',
        'DROP TABLE IF EXISTS nt_tags',
        'DROP TABLE IF EXISTS nt_notes',
        'DROP TABLE IF EXISTS nt_folders',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'notes', label: 'Notes', icon: 'file-text' },
      { key: 'folders', label: 'Folders', icon: 'folder' },
      { key: 'search', label: 'Search', icon: 'search' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'note-editor', title: 'Edit Note' },
      { name: 'note-preview', title: 'Preview' },
    ],
  },
  requiresAuth: false,
  requiresNetwork: false,
  version: '0.1.0',
};
