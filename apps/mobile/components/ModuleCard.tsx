import React, { useCallback } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FREE_MODULES, type ModuleDefinition } from '@mylife/module-registry';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';
import { useDatabase } from './DatabaseProvider';
import { getStoredEntitlement } from '../lib/entitlements';
import { isEntitlementExpired } from '@mylife/entitlements';

interface ModuleCardProps {
  module: ModuleDefinition;
}

/**
 * Grid card for a single module on the hub dashboard.
 * Shows emoji icon, name, tagline, and accent-colored left border.
 * Tapping navigates to the module's route group.
 * Premium modules require a valid entitlement to access.
 */
export function ModuleCard({ module }: ModuleCardProps) {
  const router = useRouter();
  const db = useDatabase();

  const handlePress = useCallback(() => {
    const isFree = (FREE_MODULES as readonly string[]).includes(module.id);
    if (!isFree) {
      const entitlement = getStoredEntitlement(db);
      const hasAccess = entitlement && !isEntitlementExpired(entitlement);
      if (!hasAccess) {
        Alert.alert(
          'Premium Module',
          `${module.name} requires MyLife Pro. Upgrade to unlock all modules.`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Learn More', onPress: () => router.push('/(hub)/settings' as never) },
          ],
        );
        return;
      }
    }
    router.push(`/(${module.id})` as never);
  }, [module, db, router]);

  return (
    <TouchableOpacity
      style={styles.wrapper}
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityLabel={`${module.name}, ${module.tagline}`}
      accessibilityHint={module.tier === 'premium' ? 'Premium module, requires subscription' : undefined}
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
