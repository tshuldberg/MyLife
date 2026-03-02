import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { isHealthSyncEnabled, setHealthSyncToggle } from '@mylife/health';
import {
  getHealthSyncStatus,
  probeHealthSyncStatus,
  syncHealthData,
  HEALTH_DATA_TYPES,
} from '../../lib/health-sync';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

export default function HealthSyncSettingsScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const syncStatus = getHealthSyncStatus();

  const toggleStates = useMemo(() => {
    const states: Record<string, boolean> = {};
    for (const dt of HEALTH_DATA_TYPES) {
      try {
        states[dt.key] = isHealthSyncEnabled(db, dt.key);
      } catch {
        states[dt.key] = dt.defaultEnabled;
      }
    }
    return states;
  }, [db, tick]);

  const handleToggle = (key: string, value: boolean) => {
    try {
      setHealthSyncToggle(db, key, value);
      refresh();
    } catch {
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setLastResult(null);
    try {
      const status = await probeHealthSyncStatus();
      if (!status.available) {
        setLastResult(status.reason);
        setSyncing(false);
        return;
      }

      const result = await syncHealthData(db);
      setLastResult(result.message);
      refresh();
    } catch (error) {
      setLastResult(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setSyncing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>Health Sync</Text>
      <Text variant="caption" color={colors.textSecondary} style={styles.subtitle}>
        Import health data from your wearable device. Data stays on your device.
      </Text>

      {/* Status */}
      <Card style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: syncStatus.available ? ACCENT : colors.danger }]} />
          <Text variant="body">
            {syncStatus.available
              ? `${syncStatus.platform === 'ios' ? 'Apple Health' : 'Health Connect'} available`
              : 'Health sync unavailable'}
          </Text>
        </View>
        {!syncStatus.available && (
          <Text variant="caption" color={colors.textSecondary}>
            {syncStatus.reason}
          </Text>
        )}
      </Card>

      {/* Data Type Toggles */}
      <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        Data Types
      </Text>
      {HEALTH_DATA_TYPES.map((dt) => (
        <Card key={dt.key} style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.flex1}>
              <Text variant="body">{dt.label}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                {dt.target.table === 'hl_vitals' ? `Vital: ${dt.target.vitalType}` : dt.target.table}
              </Text>
            </View>
            <Switch
              value={toggleStates[dt.key] ?? false}
              onValueChange={(val) => handleToggle(dt.key, val)}
              trackColor={{ false: colors.border, true: ACCENT }}
            />
          </View>
        </Card>
      ))}

      {/* Sync Now */}
      <Pressable
        style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
        onPress={handleSync}
        disabled={syncing}
      >
        <Text variant="label" color={colors.background}>
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Text>
      </Pressable>

      {lastResult && (
        <Card style={styles.resultCard}>
          <Text variant="caption" color={colors.textSecondary}>
            {lastResult}
          </Text>
        </Card>
      )}
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
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  syncButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  resultCard: {
    marginTop: spacing.sm,
  },
});
