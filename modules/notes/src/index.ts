// Definition
export { NOTES_MODULE } from './definition';

// Types and schemas
export type {
  Note,
  NoteFolder,
  NoteTag,
  NoteTagLink,
  NoteLink,
  NoteTemplate,
  NoteSetting,
  CreateNoteInput,
  UpdateNoteInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateTagInput,
  CreateTemplateInput,
  NoteFilter,
  NoteSearchResult,
  GraphNode,
  GraphEdge,
  NoteGraph,
  NotesStats,
} from './types';

export {
  NoteSchema,
  NoteFolderSchema,
  NoteTagSchema,
  NoteTagLinkSchema,
  NoteLinkSchema,
  NoteTemplateSchema,
  NoteSettingSchema,
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  CreateFolderInputSchema,
  UpdateFolderInputSchema,
  CreateTagInputSchema,
  CreateTemplateInputSchema,
  NoteFilterSchema,
} from './types';

// CRUD
export {
  createNote,
  getNoteById,
  getNotes,
  updateNote,
  deleteNote,
  getNoteCount,
  searchNotes,
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  createTag,
  getTags,
  getTagById,
  deleteTag,
  getTagsForNote,
  getBacklinksForNote,
  getOutgoingLinksForNote,
  getNoteGraph,
  createTemplate,
  getTemplates,
  deleteTemplate,
  getSetting,
  setSetting,
  getNotesStats,
} from './db/crud';

// Engine
export {
  extractBacklinks,
  countWords,
  extractHeadings,
  countChecklistItems,
  generateSnippet,
} from './engine/markdown';
