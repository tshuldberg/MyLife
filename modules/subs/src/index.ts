// MySubs — subscription tracking module

// Module definition (ModuleDefinition contract)
export { SUBS_MODULE } from './definition';

// Types & schemas
export {
  BillingCycle,
  SubscriptionStatus,
  CatalogCategory,
  SubscriptionSchema,
  SubscriptionInsertSchema,
  SubscriptionFilterSchema,
  SubscriptionUpdateSchema,
} from './types';
export type {
  Subscription,
  SubscriptionInsert,
  SubscriptionFilter,
  SubscriptionUpdate,
  PriceHistory,
  CatalogEntry,
  CategoryCostSummary,
  SubscriptionSummary,
} from './types';

// Database operations
export {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  countSubscriptions,
  updateSubscription,
  deleteSubscription,
  validateTransition,
  getValidTransitions,
  transitionSubscription,
  getSetting,
  setSetting,
} from './db';

// Cost normalization
export {
  normalizeToMonthly,
  normalizeToAnnual,
  normalizeToDaily,
  calculateSubscriptionSummary,
} from './cost';

// Renewal engine
export {
  calculateNextRenewal,
  advanceRenewalDate,
  getUpcomingRenewals,
} from './renewal';

// Price history
export {
  recordPriceChange,
  getPriceHistory,
  getLifetimeCost,
} from './price-history';

// Catalog
export {
  CATALOG_ENTRIES,
  isPopular,
  searchCatalog,
  getCatalogByCategory,
  getPopularEntries,
} from './catalog';
