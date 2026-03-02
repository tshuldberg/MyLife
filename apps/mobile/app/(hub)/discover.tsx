import React, { useCallback, useMemo } from 'react';
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useModuleRegistry,
  useEnabledModules,
  MODULE_METADATA,
  FREE_MODULES,
  type ModuleDefinition,
  type ModuleId,
} from '@mylife/module-registry';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';
import { useModuleToggle } from '../../hooks/use-module-toggle';
import { useDatabase } from '../../components/DatabaseProvider';
import { getStoredEntitlement } from '../../lib/entitlements';
import { isEntitlementExpired } from '@mylife/entitlements';

/** Category groupings for module discovery. */
const MODULE_CATEGORIES: { title: string; moduleIds: ModuleId[] }[] = [
  {
    title: 'Lifestyle',
    moduleIds: ['books', 'recipes', 'habits', 'words'],
  },
  {
    title: 'Social',
    moduleIds: ['rsvp'],
  },
  {
    title: 'Finance',
    moduleIds: ['budget'],
  },
  {
    title: 'Health & Fitness',
    moduleIds: ['health', 'workouts'],
  },
  {
    title: 'Exploration',
    moduleIds: ['surf', 'homes', 'car'],
  },
];

/**
 * Discover screen — browse all suite modules grouped by category.
 * Shows a lock icon overlay on premium modules.
 * Tapping a module toggles it on/off (persisted to SQLite).
 */
export default function DiscoverScreen() {
  const registry = useModuleRegistry();
  const toggle = useModuleToggle();
  const db = useDatabase();
  const router = useRouter();
  // Subscribe to enabled state changes so the list re-renders on toggle
  useEnabledModules();

  const hasEntitlement = useMemo(() => {
    const ent = getStoredEntitlement(db);
    return ent != null && !isEntitlementExpired(ent);
  }, [db]);

  const sections = MODULE_CATEGORIES.map((cat) => ({
    title: cat.title,
    data: cat.moduleIds.map((id) => MODULE_METADATA[id]),
  }));

  const handleModulePress = useCallback(
    (item: ModuleDefinition) => {
      const isFree = (FREE_MODULES as readonly string[]).includes(item.id);
      const isPremiumLocked = !isFree && !hasEntitlement;

      if (isPremiumLocked && !registry.isEnabled(item.id)) {
        // Block enabling premium modules without entitlement
        Alert.alert(
          'Premium Module',
          `${item.name} requires MyLife Pro. Upgrade to unlock all modules.`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Learn More', onPress: () => router.push('/(hub)/settings' as never) },
          ],
        );
        return;
      }

      toggle(item.id);
    },
    [toggle, hasEntitlement, registry, router],
  );

  const renderModule = useCallback(
    ({ item }: { item: ModuleDefinition }) => {
      const isEnabled = registry.isEnabled(item.id);
      const isFree = (FREE_MODULES as readonly string[]).includes(item.id);
      const isPremiumLocked = !isFree && !hasEntitlement;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.moduleRow}
          onPress={() => handleModulePress(item)}
          accessibilityLabel={`${item.name}, ${item.tagline}`}
          accessibilityHint={isPremiumLocked ? 'Premium module, requires subscription' : undefined}
        >
          <Card style={[styles.moduleCard, { borderLeftColor: item.accentColor }]}>
            <View style={styles.moduleContent}>
              <View style={styles.iconWrapper}>
                <Text style={styles.moduleIcon}>{item.icon}</Text>
                {isPremiumLocked && (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockIcon}>{'\u{1F512}'}</Text>
                  </View>
                )}
              </View>
              <View style={styles.moduleInfo}>
                <Text variant="subheading">{item.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {item.tagline}
                </Text>
              </View>
              {isPremiumLocked ? (
                <View style={[styles.statusBadge, styles.premiumBadge]}>
                  <Text variant="label" color={colors.accent}>
                    PRO
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.statusBadge,
                    isEnabled ? styles.enabledBadge : styles.disabledBadge,
                  ]}
                >
                  <Text
                    variant="label"
                    color={isEnabled ? colors.success : colors.textTertiary}
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [registry, handleModulePress, hasEntitlement],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={renderModule}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text variant="label" color={colors.textSecondary}>
            {title}
          </Text>
        </View>
      )}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.md,
  },
  moduleRow: {
    marginBottom: spacing.sm,
  },
  moduleCard: {
    borderLeftWidth: 3,
  },
  moduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  moduleIcon: {
    fontSize: 28,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 10,
  },
  moduleInfo: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  enabledBadge: {
    backgroundColor: 'rgba(91, 165, 91, 0.15)',
  },
  disabledBadge: {
    backgroundColor: 'rgba(107, 97, 85, 0.15)',
  },
  premiumBadge: {
    backgroundColor: 'rgba(201, 137, 77, 0.15)',
  },
});
