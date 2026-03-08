// Definition
export { MAIL_MODULE } from './definition';

// Types and schemas
export type {
  MailAccount,
  MailMessage,
  MailFolder,
  MailDraft,
  MailFilter,
  MailFilterField,
  MailFilterAction,
  MailStats,
  CreateMailAccountInput,
  UpdateMailAccountInput,
  CreateMailMessageInput,
  CreateMailDraftInput,
  UpdateMailDraftInput,
  CreateMailFolderInput,
  MessageFilter,
} from './types';

export {
  MailAccountSchema,
  MailMessageSchema,
  MailFolderSchema,
  MailDraftSchema,
  MailFilterSchema,
  MailFilterFieldSchema,
  MailFilterActionSchema,
  MailStatsSchema,
  CreateMailAccountInputSchema,
  UpdateMailAccountInputSchema,
  CreateMailMessageInputSchema,
  CreateMailDraftInputSchema,
  UpdateMailDraftInputSchema,
  CreateMailFolderInputSchema,
  MessageFilterSchema,
  SYSTEM_FOLDERS,
} from './types';

// CRUD
export {
  createAccount,
  getAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  createMessage,
  getMessage,
  getMessages,
  getMessagesByAccount,
  markAsRead,
  toggleStar,
  moveToFolder,
  deleteMessage,
  createDraft,
  getDrafts,
  updateDraft,
  deleteDraft,
  createFolder,
  getFolders,
  getMailStats,
} from './db/crud';

// Engine
export {
  searchMessages,
  groupByThread,
  getUnreadCount,
  filterByDateRange,
} from './engine/search';
