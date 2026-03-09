import { z } from 'zod';

// ── Mail Account ──────────────────────────────────────────────────────

export const MailAccountSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  serverHost: z.string(),
  serverPort: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MailAccount = z.infer<typeof MailAccountSchema>;

export const CreateMailAccountInputSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  serverHost: z.string().min(1),
  serverPort: z.number().int().min(1).max(65535),
  isActive: z.boolean().optional(),
});
export type CreateMailAccountInput = z.infer<typeof CreateMailAccountInputSchema>;

export const UpdateMailAccountInputSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).optional(),
  serverHost: z.string().min(1).optional(),
  serverPort: z.number().int().min(1).max(65535).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateMailAccountInput = z.infer<typeof UpdateMailAccountInputSchema>;

// ── Mail Message ──────────────────────────────────────────────────────

export const MailMessageSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  body: z.string(),
  isRead: z.boolean(),
  isStarred: z.boolean(),
  folder: z.string(),
  receivedAt: z.string(),
  createdAt: z.string(),
});
export type MailMessage = z.infer<typeof MailMessageSchema>;

export const CreateMailMessageInputSchema = z.object({
  accountId: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.array(z.string()).min(1),
  body: z.string(),
  folder: z.string().optional(),
  receivedAt: z.string().optional(),
});
export type CreateMailMessageInput = z.infer<typeof CreateMailMessageInputSchema>;

// ── Mail Folder ───────────────────────────────────────────────────────

export const MailFolderSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  sortOrder: z.number(),
  isSystem: z.boolean(),
  createdAt: z.string(),
});
export type MailFolder = z.infer<typeof MailFolderSchema>;

export const CreateMailFolderInputSchema = z.object({
  accountId: z.string(),
  name: z.string().min(1),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});
export type CreateMailFolderInput = z.infer<typeof CreateMailFolderInputSchema>;

// ── Mail Draft ────────────────────────────────────────────────────────

export const MailDraftSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  subject: z.string(),
  to: z.array(z.string()),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MailDraft = z.infer<typeof MailDraftSchema>;

export const CreateMailDraftInputSchema = z.object({
  accountId: z.string(),
  subject: z.string().optional(),
  to: z.array(z.string()).optional(),
  body: z.string().optional(),
});
export type CreateMailDraftInput = z.infer<typeof CreateMailDraftInputSchema>;

export const UpdateMailDraftInputSchema = z.object({
  subject: z.string().optional(),
  to: z.array(z.string()).optional(),
  body: z.string().optional(),
});
export type UpdateMailDraftInput = z.infer<typeof UpdateMailDraftInputSchema>;

// ── Mail Filter/Rule ──────────────────────────────────────────────────

export const MailFilterFieldSchema = z.enum(['from', 'to', 'subject', 'body']);
export type MailFilterField = z.infer<typeof MailFilterFieldSchema>;

export const MailFilterActionSchema = z.enum(['move', 'star', 'mark_read', 'delete']);
export type MailFilterAction = z.infer<typeof MailFilterActionSchema>;

export const MailFilterSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  field: MailFilterFieldSchema,
  pattern: z.string(),
  action: MailFilterActionSchema,
  actionValue: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type MailFilter = z.infer<typeof MailFilterSchema>;

// ── Mail Stats ────────────────────────────────────────────────────────

export const MailStatsSchema = z.object({
  totalMessages: z.number(),
  unreadCount: z.number(),
  starredCount: z.number(),
  draftCount: z.number(),
  byFolder: z.array(z.object({
    folder: z.string(),
    total: z.number(),
    unread: z.number(),
  })),
});
export type MailStats = z.infer<typeof MailStatsSchema>;

// ── Message Filter ────────────────────────────────────────────────────

export const MessageFilterSchema = z.object({
  folder: z.string().optional(),
  accountId: z.string().optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});
export type MessageFilter = z.infer<typeof MessageFilterSchema>;
export type MessageFilterInput = z.input<typeof MessageFilterSchema>;

// ── Default System Folders ────────────────────────────────────────────

export const SYSTEM_FOLDERS = [
  { name: 'Inbox', icon: 'inbox', sortOrder: 0 },
  { name: 'Sent', icon: 'send', sortOrder: 1 },
  { name: 'Drafts', icon: 'file-text', sortOrder: 2 },
  { name: 'Starred', icon: 'star', sortOrder: 3 },
  { name: 'Trash', icon: 'trash', sortOrder: 4 },
  { name: 'Spam', icon: 'alert-triangle', sortOrder: 5 },
] as const;
