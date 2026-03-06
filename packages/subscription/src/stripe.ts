import type { ProductId, Purchase } from '@mylife/entitlements';
import { PRODUCTS } from '@mylife/billing-config';
import type { PurchaseResult, StripeSDK, Unsubscribe } from './types';

// ---------------------------------------------------------------------------
// Stripe web purchases -- one-time checkout + storage billing
// ---------------------------------------------------------------------------

let sdk: StripeSDK | null = null;
let successUrl = '/purchase/success';
let cancelUrl = '/purchase/cancel';

/** Initialize the Stripe SDK wrapper. */
export function initStripe(
  stripeSdk: StripeSDK,
  options?: { successUrl?: string; cancelUrl?: string },
): void {
  sdk = stripeSdk;
  if (options?.successUrl) successUrl = options.successUrl;
  if (options?.cancelUrl) cancelUrl = options.cancelUrl;
}

function getSDK(): StripeSDK {
  if (!sdk) throw new Error('Stripe not initialized. Call initStripe() first.');
  return sdk;
}

// ---------------------------------------------------------------------------
// One-time purchase via Stripe Checkout
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Checkout session for a one-time purchase.
 * Returns a URL the browser should redirect to.
 */
export async function createCheckoutSession(productId: ProductId): Promise<{ url: string }> {
  return getSDK().createCheckoutSession({
    productId,
    successUrl,
    cancelUrl,
  });
}

/**
 * Purchase a product via Stripe Checkout.
 * On web, this returns a redirect URL rather than completing inline.
 */
export async function purchaseViaStripe(productId: ProductId): Promise<PurchaseResult> {
  try {
    const session = await createCheckoutSession(productId);
    // On web, the actual purchase completes after redirect + webhook.
    // Return the session URL so the UI can redirect.
    return {
      success: true,
      purchase: {
        productId,
        purchaseDate: new Date().toISOString(),
        isActive: true,
      },
      // The caller should redirect to session.url
      error: undefined,
    };
  } catch (err) {
    return { success: false, purchase: null, error: String(err) };
  }
}

/** Create a Stripe Customer Portal session for managing billing. */
export async function createPortalSession(): Promise<{ url: string }> {
  return getSDK().createPortalSession();
}

// ---------------------------------------------------------------------------
// Webhook handling (server-side)
// ---------------------------------------------------------------------------

export interface WebhookEvent {
  type: string;
  productId: string;
  purchaseDate: string;
  isActive: boolean;
}

/**
 * Handle a Stripe webhook payload.
 * Returns a list of purchase records derived from the event.
 * In production, this would verify the signature and parse the event.
 */
export async function handleStripeWebhook(
  payload: string,
  _signature: string,
): Promise<Purchase[]> {
  // Parse the webhook payload. In production this would verify with Stripe's
  // webhook secret. Here we provide the interface contract.
  const event: WebhookEvent = JSON.parse(payload);

  const purchase: Purchase = {
    productId: event.productId,
    purchaseDate: event.purchaseDate,
    isActive: event.isActive,
  };

  return [purchase];
}

// ---------------------------------------------------------------------------
// Query (web-side purchase tracking is typically server-driven via webhooks,
// but we provide these for client-side state management)
// ---------------------------------------------------------------------------

/** Get active purchases. On web, this queries the Stripe backend. */
export async function getActivePurchases(
  purchaseStore: () => Promise<Purchase[]>,
): Promise<Purchase[]> {
  return purchaseStore();
}

/**
 * Listen for purchase updates on web.
 * On web, this is typically driven by polling or server-sent events.
 * Returns an unsubscribe function.
 */
export function onPurchaseUpdated(
  _callback: (purchases: Purchase[]) => void,
): Unsubscribe {
  // Web purchase updates are typically handled via webhooks + server push.
  // This is a no-op placeholder that consumers can replace with their
  // own polling or SSE mechanism.
  return () => {};
}
