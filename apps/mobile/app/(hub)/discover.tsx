import React, { useCallback } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  useModuleRegistry,
  useEnabledModules,
  MODULE_METADATA,
  type ModuleDefinition,
  type ModuleId,
} from '@mylife/module-registry';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';
import { useModuleToggle } from '../../hooks/use-module-toggle';

/** Category groupings for module discovery. */
const MODULE_CATEGORIES: { title: string; moduleIds: ModuleId[] }[] = [
  {
    title: 'Lifestyle',
    moduleIds: ['books', 'recipes', 'habits', 'words'],
  },
  {
    title: 'Finance',
    moduleIds: ['budget', 'subs'],
  },
  {
    title: 'Health & Fitness',
    moduleIds: ['fast', 'workouts', 'meds'],
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
  // Subscribe to enabled state changes so the list re-renders on toggle
  useEnabledModules();

  const sections = MODULE_CATEGORIES.map((cat) => ({
    title: cat.title,
    data: cat.moduleIds.map((id) => MODULE_METADATA[id]),
  }));

  const renderModule = useCallback(
    ({ item }: { item: ModuleDefinition }) => {
      const isEnabled = registry.isEnabled(item.id);
      const isPremium = item.tier === 'premium';

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.moduleRow}
          onPress={() => toggle(item.id)}
        >
          <Card style={[styles.moduleCard, { borderLeftColor: item.accentColor }]}>
            <View style={styles.moduleContent}>
              <View style={styles.iconWrapper}>
                <Text style={styles.moduleIcon}>{item.icon}</Text>
                {isPremium && (
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
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [registry, toggle],
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
});
