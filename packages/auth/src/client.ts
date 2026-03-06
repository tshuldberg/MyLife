import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TokenStorage } from './types';

export interface SupabaseClientOptions {
  url: string;
  anonKey: string;
  storage?: TokenStorage;
}

let sharedClient: SupabaseClient | null = null;

/**
 * Create or return the shared Supabase client.
 *
 * An optional `storage` adapter can be provided for token persistence
 * (e.g. expo-secure-store on mobile, localStorage on web).
 */
export function getSupabaseClient(options: SupabaseClientOptions): SupabaseClient {
  if (sharedClient) return sharedClient;

  sharedClient = createClient(options.url, options.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: typeof window !== 'undefined',
      ...(options.storage
        ? {
            storage: {
              getItem: (key: string) => options.storage!.getItem(key),
              setItem: (key: string, value: string) => options.storage!.setItem(key, value),
              removeItem: (key: string) => options.storage!.removeItem(key),
            },
          }
        : {}),
    },
  });

  return sharedClient;
}

/** Reset the shared client (useful for tests). */
export function resetSupabaseClient(): void {
  sharedClient = null;
}
