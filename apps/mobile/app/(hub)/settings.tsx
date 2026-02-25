import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import {
  getModeConfig,
  getStoredEntitlement,
  refreshEntitlementFromServer,
} from '../../lib/entitlements';

/**
 * Settings screen — subscription status placeholder and app info.
 *
 * This is a shell with placeholder sections. The subscription system
 * and full preferences will be wired up once the subscription package
 * is integrated.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const modeConfig = getModeConfig(db);
  const entitlement = getStoredEntitlement(db);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshEntitlementFromServer(db);
      if (result.ok) {
        setRefreshMessage('Entitlement refreshed.');
      } else {
        setRefreshMessage(`Refresh failed: ${result.reason}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Subscription Status */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          Subscription
        </Text>
        <Card>
          <View style={styles.row}>
            <Text variant="body">Current Plan</Text>
            <View style={styles.freeBadge}>
              <Text variant="label" color={colors.textSecondary}>
                FREE
              </Text>
            </View>
          </View>
          <Text variant="caption" color={colors.textSecondary} style={styles.subscriptionNote}>
            Upgrade to Premium to unlock all modules.
          </Text>
        </Card>
      </View>

      {/* Mode */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          Mode
        </Text>
        <Card>
          <View style={styles.row}>
            <Text variant="body">Current Mode</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {modeConfig.mode.toUpperCase()}
            </Text>
          </View>
          {modeConfig.serverUrl && (
            <Text variant="caption" color={colors.textSecondary} style={styles.subscriptionNote}>
              Server: {modeConfig.serverUrl}
            </Text>
          )}
          <Pressable style={styles.modeButton} onPress={() => router.push('/(hub)/onboarding-mode')}>
            <Text variant="label">Change Mode</Text>
          </Pressable>
          <Pressable style={styles.modeButton} onPress={() => router.push('/(hub)/self-host')}>
            <Text variant="label">Self-Host Setup</Text>
          </Pressable>
        </Card>
      </View>

      {/* Entitlements */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          Entitlements
        </Text>
        <Card>
          <View style={styles.row}>
            <Text variant="body">Sync</Text>
            <Pressable style={styles.modeButton} onPress={() => void handleRefresh()} disabled={isRefreshing}>
              <Text variant="label">{isRefreshing ? 'Refreshing...' : 'Refresh'}</Text>
            </Pressable>
          </View>
          {refreshMessage && (
            <Text variant="caption" color={colors.textSecondary} style={styles.subscriptionNote}>
              {refreshMessage}
            </Text>
          )}
          {entitlement ? (
            <>
              <View style={styles.row}>
                <Text variant="body">Hosted</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entitlement.hostedActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
              <View style={[styles.row, styles.rowBorder]}>
                <Text variant="body">Self-host</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entitlement.selfHostLicense ? 'LICENSED' : 'NO LICENSE'}
                </Text>
              </View>
              <View style={[styles.row, styles.rowBorder]}>
                <Text variant="body">Update Pack</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {entitlement.updatePackYear ?? 'None'}
                </Text>
              </View>
            </>
          ) : (
            <Text variant="caption" color={colors.textSecondary}>
              No entitlement cached
            </Text>
          )}
        </Card>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          App Info
        </Text>
        <Card>
          <View style={styles.row}>
            <Text variant="body">Version</Text>
            <Text variant="body" color={colors.textSecondary}>
              0.1.0
            </Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text variant="body">Database</Text>
            <Text variant="body" color={colors.textSecondary}>
              SQLite (local)
            </Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text variant="body">Privacy</Text>
            <Text variant="body" color={colors.textSecondary}>
              All data on-device
            </Text>
          </View>
        </Card>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
          Data
        </Text>
        <Card>
          <View style={styles.row}>
            <Text variant="body">Export Data</Text>
            <Text variant="caption" color={colors.textTertiary}>
              Coming soon
            </Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text variant="body">Reset All Data</Text>
            <Text variant="caption" color={colors.danger}>
              Destructive
            </Text>
          </View>
        </Card>
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
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  freeBadge: {
    backgroundColor: 'rgba(107, 97, 85, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  subscriptionNote: {
    marginTop: spacing.xs,
  },
  modeButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
