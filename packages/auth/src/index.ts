// @mylife/auth -- Supabase Auth wrapper (optional, cloud-sync only)

// Types
export type {
  AuthState,
  AuthResult,
  TokenStorage,
  PlanMode,
} from './types';

// Client
export { getSupabaseClient, resetSupabaseClient } from './client';
export type { SupabaseClientOptions } from './client';

// Service
export { AuthService, requiresAuth, INITIAL_AUTH_STATE, UNAUTHENTICATED_STATE } from './service';

// React integration
export { AuthProvider, useAuth } from './provider';
export type { AuthProviderProps, UseAuthReturn } from './provider';
