/**
 * @mylife/auth -- Shared auth types.
 *
 * Defines the dual-auth model: local (SQLite) is default,
 * cloud (Supabase/Clerk) is opt-in per module.
 */

import { z } from 'zod';

// ── Auth Modes ──────────────────────────────────────────────────────

/** Local = SQLite on-device, Cloud = Supabase/Clerk hosted */
export type AuthMode = 'local' | 'cloud';

/** Cloud auth provider for modules that opt in */
export type CloudProvider = 'supabase' | 'clerk';

// ── Per-Module Auth Config ──────────────────────────────────────────

export interface PerModuleAuthConfig {
  /** Which auth mode this module uses */
  mode: AuthMode;
  /** Cloud provider (only when mode is 'cloud') */
  cloudProvider?: CloudProvider;
  /** Whether this module requires auth at all (some may be fully anonymous) */
  requiresAuth: boolean;
}

// ── Auth State ──────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  createdAt: string;
  expiresAt: string | null;
}

export type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AuthUser; session: AuthSession };

// ── Password Validation ─────────────────────────────────────────────

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very_strong';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: PasswordStrength;
}

// ── Zod Schemas ─────────────────────────────────────────────────────

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.');

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required.')
  .max(64, 'Display name must be 64 characters or fewer.');

// ── Auth Operation Results ──────────────────────────────────────────

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
