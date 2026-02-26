/**
 * @mylife/db — Hub database package.
 *
 * Provides the DatabaseAdapter interface, hub schema DDL,
 * migration runner, and CRUD queries for hub-level tables.
 */

// Adapter interface and migration types
export type { DatabaseAdapter, Migration } from './adapter';

// Hub schema DDL
export {
  CREATE_HUB_ENABLED_MODULES,
  CREATE_HUB_PREFERENCES,
  CREATE_HUB_AGGREGATE_EVENT_COUNTERS,
  CREATE_HUB_SUBSCRIPTION,
  CREATE_HUB_MODE,
  CREATE_HUB_ENTITLEMENTS,
  CREATE_HUB_FRIEND_PROFILES,
  CREATE_HUB_FRIEND_INVITES,
  CREATE_HUB_FRIENDSHIPS,
  CREATE_HUB_FRIEND_MESSAGES,
  CREATE_HUB_FRIEND_MESSAGE_OUTBOX,
  CREATE_HUB_FRIEND_INDEXES,
  CREATE_HUB_REVOKED_ENTITLEMENTS,
  CREATE_HUB_SCHEMA_VERSIONS,
  HUB_TABLES,
  createHubTables,
} from './hub-schema';

// Migration runner
export { runModuleMigrations, initializeHubDatabase } from './migration-runner';

// Test helpers/factories
export {
  createInMemoryTestDatabase,
  createHubTestDatabase,
  createModuleTestDatabase,
} from './test-utils';
export type { InMemoryTestDatabase } from './test-utils';
export { createIdFactory, utcDateWithOffset, isoNoonUtc } from './test-factories';

// Hub CRUD queries
export {
  getEnabledModules,
  isModuleEnabled,
  enableModule,
  disableModule,
  incrementAggregateEventCounter,
  getAggregateEventCounter,
  listAggregateEventCounters,
  getPreference,
  setPreference,
  deletePreference,
  getAllPreferences,
  getHubMode,
  setHubMode,
  getHubEntitlement,
  setHubEntitlement,
  clearHubEntitlement,
  upsertFriendProfile,
  getFriendProfile,
  listFriendProfiles,
  createFriendInvite,
  getFriendInvite,
  listIncomingFriendInvites,
  listOutgoingFriendInvites,
  acceptFriendInvite,
  declineFriendInvite,
  revokeFriendInvite,
  listFriendsForUser,
  areUsersFriends,
  removeFriendship,
  createFriendMessage,
  upsertFriendMessageFromServer,
  getFriendMessageByClientMessageId,
  getFriendMessageById,
  listFriendConversationMessages,
  listFriendMessageInbox,
  markFriendMessageRead,
  queueFriendMessageOutbox,
  listFriendMessageOutboxDue,
  markFriendMessageOutboxSent,
  markFriendMessageOutboxRetry,
  markFriendMessageOutboxFailed,
  getLatestFriendMessageCreatedAt,
  countFriendMessageOutboxByStatus,
  revokeHubEntitlement,
  unrevokeHubEntitlement,
  isHubEntitlementRevoked,
  listRevokedHubEntitlements,
  getSubscription,
  setSubscription,
  getModuleSchemaVersion,
  getModuleMigrationHistory,
  getAllSchemaVersions,
} from './hub-queries';

// Re-export query types
export type {
  EnabledModule,
  AggregateEventCounter,
  HubMode,
  HubEntitlement,
  FriendProfile,
  FriendInvite,
  FriendInviteStatus,
  Friendship,
  FriendshipStatus,
  FriendConnection,
  FriendMessage,
  FriendMessageContentType,
  FriendMessageSource,
  FriendMessageSyncState,
  FriendInboxItem,
  FriendMessageOutboxEntry,
  FriendMessageOutboxStatus,
  RevokedEntitlement,
  HubPlanMode,
  Subscription,
  SchemaVersion,
} from './hub-queries';
