import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  MODULE_IDS,
  MODULE_METADATA,
  type ModuleDefinition,
} from '@mylife/module-registry';
import { Text, colors, spacing } from '@mylife/ui';
import { ModuleCard } from '../../components/ModuleCard';

/**
 * App selector home screen for MyLife mobile.
 * Shows all module experiences in a single place for quick switching.
 */
export default function AppSelectorScreen() {
  const modules = MODULE_IDS.map((id) => MODULE_METADATA[id]);

  return (
    <FlatList<ModuleDefinition>
      data={modules}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.welcomeIcon}>{'\u{1F331}'}</Text>
          <Text variant="heading" style={styles.welcomeTitle}>
            MyLife
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.welcomeBody}>
            Choose an app to open.
          </Text>
        </View>
      }
      renderItem={({ item }) => <ModuleCard module={item} />}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  welcomeIcon: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  welcomeBody: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
