// @mylife/subscription -- RevenueCat IAP (mobile) + Stripe (web) + storage billing

// Types
export type {
  Platform,
  PurchaseResult,
  StorageSubscription,
  Unsubscribe,
  RevenueCatSDK,
  StripeSDK,
  PaymentService,
} from './types';

// RevenueCat (mobile IAP)
export {
  initRevenueCat,
  purchaseHubUnlock,
  purchaseStandaloneModule,
  purchaseAnnualUpdate,
  restorePurchases,
  getActivePurchases as getActivePurchasesMobile,
  hasPurchased,
  onPurchaseUpdated as onPurchaseUpdatedMobile,
} from './revenuecat';

// Stripe (web purchases)
export {
  initStripe,
  createCheckoutSession,
  purchaseViaStripe,
  createPortalSession,
  handleStripeWebhook,
} from './stripe';

// Storage billing (Stripe subscriptions)
export {
  initStorageBilling,
  upgradeStorageTier,
  downgradeStorageTier,
  cancelStorageTier,
  getStorageSubscription,
} from './storage';

// Unified service
export { createPaymentService } from './service';
export type { PaymentServiceConfig } from './service';
