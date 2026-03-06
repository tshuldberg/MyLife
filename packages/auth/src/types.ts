import type { User, Session } from '@supabase/supabase-js';

/** Plan modes that require authentication. */
export type AuthRequiredMode = 'hosted';

/** All plan modes from the entitlements package. */
export type PlanMode = 'hosted' | 'self_host' | 'local_only';

/** Auth state exposed to consumers. */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Result of a sign-up or sign-in operation. */
export interface AuthResult {
  success: boolean;
  user: User | null;
  session: Session | null;
  error: string | null;
}

/** Token storage adapter for platform-specific persistence. */
export interface TokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
