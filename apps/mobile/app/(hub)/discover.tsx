import React, { useCallback, useMemo } from 'react';
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from 'lucide-react-native';
import {
  useModuleRegistry,
  useEnabledModules,
  MODULE_METADATA,
  MODULE_ICONS,
  FREE_MODULES,
  type ModuleDefinition,
  type ModuleId,
} from '@mylife/module-registry';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';
import { useModuleToggle } from '../../hooks/use-module-toggle';
import { useDatabase } from '../../components/DatabaseProvider';
import { getStoredEntitlement } from '../../lib/entitlements';
import { isEntitlementExpired } from '@mylife/entitlements';

/** Convert "kebab-case" Lucide name to PascalCase key used by the icons map. */
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
}

/** Resolve a Lucide icon component by its kebab-case name. */
function getIcon(name: string) {
  const key = toPascalCase(name);
  return (icons as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[key] ?? null;
}

/** Category groupings for module discovery -- all 27 modules. */
const MODULE_CATEGORIES: { title: string; moduleIds: ModuleId[] }[] = [
  {
    title: 'Lifestyle',
    moduleIds: ['books', 'recipes', 'words', 'journal', 'notes', 'flash'],
  },
  {
    title: 'Health & Fitness',
    moduleIds: ['health', 'workouts', 'fast', 'meds', 'nutrition', 'mood', 'cycle'],
  },
  {
    title: 'Finance',
    moduleIds: ['budget', 'subs'],
  },
  {
    title: 'Home & Auto',
    moduleIds: ['homes', 'car', 'garden', 'closet'],
  },
  {
    title: 'Social & Events',
    moduleIds: ['rsvp', 'mail', 'voice'],
  },
  {
    title: 'Exploration',
    moduleIds: ['surf', 'trails', 'stars', 'pets'],
  },
];

/**
 * Discover screen -- browse all suite modules grouped by category.
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
      const iconName = MODULE_ICONS[item.id] ?? 'circle';
      const IconComponent = getIcon(iconName);
      const LockIcon = getIcon('lock');

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
                <View style={[styles.iconCircle, { backgroundColor: item.accentColor + '20' }]}>
                  {IconComponent ? (
                    <IconComponent size={22} color={item.accentColor} strokeWidth={1.8} />
                  ) : (
                    <Text style={styles.moduleIcon}>{item.icon}</Text>
                  )}
                </View>
                {isPremiumLocked && LockIcon && (
                  <View style={styles.lockBadge}>
                    <LockIcon size={10} color={colors.textTertiary} strokeWidth={2} />
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleIcon: {
    fontSize: 20,
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
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  disabledBadge: {
    backgroundColor: 'rgba(240, 240, 245, 0.06)',
  },
  premiumBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
});
