import type { ModuleDefinition } from '@mylife/module-registry';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';

export const MAIL_MODULE: ModuleDefinition = {
  id: 'mail',
  name: 'MyMail',
  tagline: 'Self-hosted private email',
  icon: '📬',
  accentColor: '#3B82F6',
  tier: 'premium',
  storageType: 'sqlite',
  schemaVersion: 1,
  tablePrefix: 'ml_',
  migrations: [
    {
      version: 1,
      description: 'Create mail tables: accounts, messages, drafts, folders',
      up: [...ALL_TABLES, ...CREATE_INDEXES],
      down: [
        'DROP TABLE IF EXISTS ml_folders',
        'DROP TABLE IF EXISTS ml_drafts',
        'DROP TABLE IF EXISTS ml_messages',
        'DROP TABLE IF EXISTS ml_accounts',
      ],
    },
  ],
  navigation: {
    tabs: [
      { key: 'inbox', label: 'Inbox', icon: 'inbox' },
      { key: 'compose', label: 'Compose', icon: 'edit' },
      { key: 'folders', label: 'Folders', icon: 'folder' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
    screens: [
      { name: 'message-detail', title: 'Message' },
      { name: 'compose-message', title: 'Compose' },
      { name: 'server-setup', title: 'Server Setup' },
    ],
  },
  requiresAuth: true,
  requiresNetwork: true,
  version: '0.1.0',
};
