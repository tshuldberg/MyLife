/** Runtime mode selected by the user. */
export type PlanMode = 'hosted' | 'self_host' | 'local_only';

/**
 * Signed entitlement payload consumed by clients.
 *
 * `signature` is computed over all other fields.
 */
export interface Entitlements {
  appId: string;
  mode: PlanMode;
  hostedActive: boolean;
  selfHostLicense: boolean;
  updatePackYear?: number;
  features: string[];
  issuedAt: string;
  expiresAt?: string;
  signature: string;
}

/** Input shape for signing, before a signature is attached. */
export type UnsignedEntitlements = Omit<Entitlements, 'signature'>;
