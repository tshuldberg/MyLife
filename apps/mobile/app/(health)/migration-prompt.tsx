import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  detectAbsorbedModuleData,
  isAbsorptionMigrated,
  migrateAbsorbedSettings,
  disableAbsorbedModules,
} from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

export default function MigrationPromptScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [migrating, setMigrating] = useState(false);

  const alreadyDone = useMemo(() => {
    try { return isAbsorptionMigrated(db); } catch { return false; }
  }, [db]);

  const data = useMemo(() => {
    try { return detectAbsorbedModuleData(db); } catch { return null; }
  }, [db]);

  const handleMigrate = useCallback(() => {
    setMigrating(true);
    try {
      migrateAbsorbedSettings(db);
      disableAbsorbedModules(db);
    } catch {
      // Best effort -- settings copy is non-critical
    }
    setMigrating(false);
    router.replace('/(health)');
  }, [db, router]);

  const handleSkip = useCallback(() => {
    router.replace('/(health)');
  }, [router]);

  // If already migrated or no data, just go to health
  if (alreadyDone || !data || (!data.hasMedsData && !data.hasFastData && !data.hasCycleData)) {
    router.replace('/(health)');
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>Welcome to MyHealth</Text>
      <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
        We found existing health data from your other modules. MyHealth consolidates
        everything into one place.
      </Text>

      {/* Detected Data */}
      <Card style={styles.card}>
        <Text variant="subheading">Your Data</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.description}>
          All your data is already accessible in MyHealth. No data will be moved or deleted.
        </Text>

        {data.hasMedsData && (
          <View style={styles.dataRow}>
            <View style={[styles.dot, { backgroundColor: '#06B6D4' }]} />
            <Text variant="body">{data.medsCount} medications from MyMeds</Text>
          </View>
        )}
        {data.hasFastData && (
          <View style={styles.dataRow}>
            <View style={[styles.dot, { backgroundColor: '#14B8A6' }]} />
            <Text variant="body">{data.fastCount} fasting sessions from MyFast</Text>
          </View>
        )}
        {data.hasCycleData && (
          <View style={styles.dataRow}>
            <View style={[styles.dot, { backgroundColor: '#EC4899' }]} />
            <Text variant="body">{data.cycleCount} cycle entries from MyHabits</Text>
          </View>
        )}
      </Card>

      {/* What happens */}
      <Card style={styles.card}>
        <Text variant="subheading">What will happen</Text>
        <View style={styles.bulletList}>
          <Text variant="caption" color={colors.textSecondary}>
            Your settings and preferences will be copied to MyHealth
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            MyMeds and MyFast will be disabled from the hub (data preserved)
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            You can re-enable them anytime from the Discover screen
          </Text>
        </View>
      </Card>

      <Pressable
        style={[styles.primaryButton, migrating && styles.disabled]}
        onPress={handleMigrate}
        disabled={migrating}
      >
        <Text variant="label" color={colors.background}>
          {migrating ? 'Migrating...' : 'Switch to MyHealth'}
        </Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text variant="caption" color={colors.textSecondary}>
          Skip for now
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  description: {
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bulletList: {
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
