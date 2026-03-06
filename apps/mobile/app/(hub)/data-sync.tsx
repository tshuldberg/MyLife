import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';
import { useAuth } from '@mylife/auth';
import {
  useSyncStatus,
  useSetSyncTier,
  STORAGE_LIMITS,
  tierRequiresAuth,
  isCloudTier,
  type SyncTier,
} from '@mylife/sync';
import { PRODUCTS } from '@mylife/billing-config';
import { useEntitlements, usePayment } from '../../components/EntitlementsProvider';

const TIER_OPTIONS: Array<{
  tier: SyncTier;
  label: string;
  description: string;
  price: string | null;
}> = [
  {
    tier: 'local_only',
    label: 'Local Only',
    description: 'Data stays on this device. No sync, maximum privacy.',
    price: null,
  },
  {
    tier: 'p2p',
    label: 'Peer-to-Peer',
    description: 'Sync directly between your devices via WebRTC. No cloud, no account needed.',
    price: null,
  },
  {
    tier: 'free_cloud',
    label: 'Free Cloud',
    description: '1 GB cloud sync. Requires a free account.',
    price: 'Free',
  },
  {
    tier: 'starter_cloud',
    label: 'Starter Cloud',
    description: '5 GB cloud sync with priority support.',
    price: `$${PRODUCTS.storageTiers.starter.price.toFixed(2)}/mo`,
  },
  {
    tier: 'power_cloud',
    label: 'Power Cloud',
    description: '25 GB cloud sync with priority support.',
    price: `$${PRODUCTS.storageTiers.power.price.toFixed(2)}/mo`,
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

function formatLimit(bytes: number): string {
  if (!isFinite(bytes)) return 'Unlimited';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(0)} GB`;
}

/**
 * Data & Sync settings screen.
 *
 * Shows current sync mode, allows switching tiers, handles P2P pairing,
 * and shows cloud authentication/storage usage.
 */
export default function DataSyncScreen() {
  const syncStatus = useSyncStatus();
  const setSyncTier = useSetSyncTier();
  const { isAuthenticated, signIn, signUp, isLoading: authLoading } = useAuth();
  const entitlements = useEntitlements();
  const { paymentService } = usePayment();

  const [changingTier, setChangingTier] = useState<SyncTier | null>(null);
  const [pairCode, setPairCode] = useState('');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const usedPercent =
    isFinite(syncStatus.storageLimitBytes) && syncStatus.storageLimitBytes > 0
      ? Math.min((syncStatus.storageUsedBytes / syncStatus.storageLimitBytes) * 100, 100)
      : 0;

  const handleTierChange = async (tier: SyncTier) => {
    setChangingTier(tier);
    try {
      // For paid cloud tiers, upgrade storage first
      if (tier === 'starter_cloud' && paymentService) {
        await paymentService.upgradeStorage('starter');
      } else if (tier === 'power_cloud' && paymentService) {
        await paymentService.upgradeStorage('power');
      }
      await setSyncTier(tier);
    } finally {
      setChangingTier(null);
    }
  };

  const handleAuth = async () => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const result = authMode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
      if (!result.success) {
        setAuthError(result.error ?? 'Authentication failed');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Current mode display */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          Current Sync Mode
        </Text>
        <Card>
          <View style={styles.row}>
            <Text variant="body">
              {TIER_OPTIONS.find((t) => t.tier === syncStatus.tier)?.label ?? syncStatus.tier}
            </Text>
            <View style={[styles.statusDot, syncStatus.connected && styles.statusConnected]} />
          </View>
          {syncStatus.lastSyncedAt && (
            <Text variant="caption" color={colors.textSecondary}>
              Last synced: {syncStatus.lastSyncedAt.toLocaleString()}
            </Text>
          )}
          {syncStatus.pendingChanges > 0 && (
            <Text variant="caption" color={colors.textSecondary} style={styles.pendingText}>
              {syncStatus.pendingChanges} pending change{syncStatus.pendingChanges !== 1 ? 's' : ''}
            </Text>
          )}
        </Card>
      </View>

      {/* Storage usage (cloud tiers) */}
      {isCloudTier(syncStatus.tier) && (
        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            Storage Usage
          </Text>
          <Card>
            <Text variant="body" style={styles.usageText}>
              {formatBytes(syncStatus.storageUsedBytes)} of {formatLimit(syncStatus.storageLimitBytes)} used
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${usedPercent}%` }]} />
            </View>
          </Card>
        </View>
      )}

      {/* P2P pairing section */}
      {syncStatus.tier === 'p2p' && (
        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            Peer-to-Peer Pairing
          </Text>
          <Card>
            <Text variant="caption" color={colors.textSecondary} style={styles.pairDescription}>
              Enter a pairing code from your other device, or share your code to connect.
            </Text>
            <TextInput
              style={styles.pairInput}
              value={pairCode}
              onChangeText={setPairCode}
              placeholder="Enter partner code"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
            />
          </Card>
        </View>
      )}

      {/* Auth section for cloud tiers */}
      {tierRequiresAuth(syncStatus.tier) && !isAuthenticated && (
        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            Sign In for Cloud Sync
          </Text>
          <Card>
            <Text variant="caption" color={colors.textSecondary} style={styles.authDescription}>
              A free account is required to enable cloud sync.
            </Text>
            <TextInput
              style={styles.authInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.authInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
            {authError && (
              <Text variant="caption" color={colors.danger} style={styles.authError}>
                {authError}
              </Text>
            )}
            <Pressable
              style={[styles.authButton, authSubmitting && styles.disabled]}
              onPress={() => void handleAuth()}
              disabled={authSubmitting}
            >
              {authSubmitting ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.authButtonText}>
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={styles.toggleAuth}
            >
              <Text variant="caption" color={colors.textSecondary}>
                {authMode === 'signin'
                  ? 'Need an account? Sign up'
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </Card>
        </View>
      )}

      {/* Mode selector */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          Change Sync Mode
        </Text>
        {TIER_OPTIONS.map((option) => {
          const isActive = syncStatus.tier === option.tier;
          const isChanging = changingTier === option.tier;
          const needsAuth = tierRequiresAuth(option.tier) && !isAuthenticated;

          return (
            <Pressable
              key={option.tier}
              style={[
                styles.tierCard,
                isActive && styles.tierCardActive,
              ]}
              onPress={() => void handleTierChange(option.tier)}
              disabled={isActive || changingTier !== null}
            >
              <View style={styles.tierHeader}>
                <Text variant="body" style={styles.tierLabel}>
                  {option.label}
                </Text>
                <View style={styles.tierRight}>
                  {option.price && (
                    <Text variant="caption" color={colors.textSecondary}>
                      {option.price}
                    </Text>
                  )}
                  {isChanging && <ActivityIndicator color={colors.textSecondary} size="small" />}
                  {isActive && (
                    <View style={styles.activeDot} />
                  )}
                </View>
              </View>
              <Text variant="caption" color={colors.textSecondary}>
                {option.description}
              </Text>
              {needsAuth && (
                <Text variant="caption" color={colors.textTertiary} style={styles.authNote}>
                  Requires sign-in
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  statusConnected: {
    backgroundColor: colors.success,
  },
  pendingText: {
    marginTop: spacing.xs,
  },
  usageText: {
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  pairDescription: {
    marginBottom: spacing.sm,
  },
  pairInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  authDescription: {
    marginBottom: spacing.sm,
  },
  authInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  authError: {
    marginBottom: spacing.sm,
  },
  authButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleAuth: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tierCardActive: {
    borderColor: colors.success,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tierLabel: {
    fontWeight: '600',
  },
  tierRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  authNote: {
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
