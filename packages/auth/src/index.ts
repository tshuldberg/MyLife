/**
 * @mylife/auth -- Shared auth package.
 *
 * Dual-auth model: local (SQLite) is the default,
 * cloud (Supabase/Clerk) is opt-in per module.
 */

// Types
export type {
  AuthMode,
  CloudProvider,
  PerModuleAuthConfig,
  AuthUser,
  AuthSession,
  AuthState,
  PasswordStrength,
  PasswordValidationResult,
  AuthResult,
} from './types';
export { EmailSchema, DisplayNameSchema } from './types';

// Password validation
export {
  validatePassword,
  getPasswordStrength,
  generatePassphraseSuggestion,
} from './password-validation';

// Local auth service
export {
  CREATE_HUB_AUTH_USERS,
  CREATE_HUB_AUTH_SESSIONS,
  AUTH_TABLES,
  createAuthTables,
  registerUser,
  loginUser,
  logoutSession,
  logoutAllSessions,
  getSessionUser,
  updatePassword,
  deleteAccount,
} from './local-auth';
