import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ModuleDefinition } from '@mylife/module-registry';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';

interface ModuleCardProps {
  module: ModuleDefinition;
}

/**
 * Grid card for a single module on the hub dashboard.
 * Shows emoji icon, name, tagline, and accent-colored left border.
 * Tapping navigates to the module's route group.
 */
export function ModuleCard({ module }: ModuleCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.wrapper}
      activeOpacity={0.7}
      onPress={() => router.push(`/(${module.id})` as never)}
    >
      <Card style={[styles.card, { borderLeftColor: module.accentColor }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{module.icon}</Text>
        </View>
        <Text variant="subheading" style={styles.name}>
          {module.name}
        </Text>
        <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>
          {module.tagline}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: spacing.xs,
  },
  card: {
    borderLeftWidth: 3,
    borderRadius: borderRadius.lg,
    minHeight: 130,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    marginBottom: spacing.xs,
  },
});
