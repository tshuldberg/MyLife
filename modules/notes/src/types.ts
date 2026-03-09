import { z } from 'zod';

// ── Core Entities ──────────────────────────────────────────────────────

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  folderId: z.string().nullable(),
  isPinned: z.boolean(),
  isFavorite: z.boolean(),
  wordCount: z.number().int(),
  charCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const NoteFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NoteFolder = z.infer<typeof NoteFolderSchema>;

export const NoteTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  createdAt: z.string(),
});
export type NoteTag = z.infer<typeof NoteTagSchema>;

export const NoteTagLinkSchema = z.object({
  noteId: z.string(),
  tagId: z.string(),
});
export type NoteTagLink = z.infer<typeof NoteTagLinkSchema>;

export const NoteLinkSchema = z.object({
  id: z.string(),
  sourceNoteId: z.string(),
  targetNoteId: z.string(),
  createdAt: z.string(),
});
export type NoteLink = z.infer<typeof NoteLinkSchema>;

export const NoteTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
export type NoteTemplate = z.infer<typeof NoteTemplateSchema>;

export const NoteSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type NoteSetting = z.infer<typeof NoteSettingSchema>;

// ── Input Schemas ──────────────────────────────────────────────────────

export const CreateNoteInputSchema = z.object({
  title: z.string().min(0).max(255).default(''),
  body: z.string().default(''),
  folderId: z.string().nullable().default(null),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  tagIds: z.array(z.string()).default([]),
});
export type CreateNoteInput = z.input<typeof CreateNoteInputSchema>;

export const UpdateNoteInputSchema = z.object({
  title: z.string().min(0).max(255).optional(),
  body: z.string().optional(),
  folderId: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type UpdateNoteInput = z.input<typeof UpdateNoteInputSchema>;

export const CreateFolderInputSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullable().default(null),
  sortOrder: z.number().int().default(0),
});
export type CreateFolderInput = z.input<typeof CreateFolderInputSchema>;

export const UpdateFolderInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateFolderInput = z.input<typeof UpdateFolderInputSchema>;

export const CreateTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().nullable().default(null),
});
export type CreateTagInput = z.input<typeof CreateTagInputSchema>;

export const CreateTemplateInputSchema = z.object({
  name: z.string().min(1).max(100),
  body: z.string().default(''),
});
export type CreateTemplateInput = z.input<typeof CreateTemplateInputSchema>;

export const NoteFilterSchema = z.object({
  folderId: z.string().nullable().optional(),
  tagId: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  sortBy: z.enum(['updated', 'created', 'title']).default('updated'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});
export type NoteFilter = z.input<typeof NoteFilterSchema>;

// ── Search Result ──────────────────────────────────────────────────────

export interface NoteSearchResult {
  id: string;
  title: string;
  snippet: string;
  rank: number;
}

// ── Graph Types ────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  title: string;
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface NoteGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Stats ──────────────────────────────────────────────────────────────

export interface NotesStats {
  totalNotes: number;
  totalFolders: number;
  totalTags: number;
  totalWords: number;
  pinnedCount: number;
  favoriteCount: number;
}
