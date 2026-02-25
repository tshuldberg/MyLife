import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useEnabledModules, type ModuleDefinition } from '@mylife/module-registry';
import { Text, colors, spacing } from '@mylife/ui';
import { ModuleCard } from '../../components/ModuleCard';

/**
 * Dashboard screen — the main hub landing page.
 *
 * Displays a 2-column grid of ModuleCard for each enabled module.
 * Shows a welcome message when no modules are enabled yet.
 */
export default function DashboardScreen() {
  const enabledModules = useEnabledModules();

  if (enabledModules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.welcomeIcon}>{'\u{1F331}'}</Text>
        <Text variant="heading" style={styles.welcomeTitle}>
          Welcome to MyLife
        </Text>
        <Text variant="body" color={colors.textSecondary} style={styles.welcomeBody}>
          Head to Discover to enable your first module and start building your
          personal hub.
        </Text>
      </View>
    );
  }

  return (
    <FlatList<ModuleDefinition>
      data={enabledModules}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => <ModuleCard module={item} />}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeBody: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
