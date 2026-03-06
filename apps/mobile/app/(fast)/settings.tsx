import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, TextInput, View } from 'react-native';
import {
  getSetting,
  setSetting,
  getNotificationPreferences,
  setNotificationPreference,
  listGoals,
  listGoalProgress,
  createGoal,
  upsertGoal,
  refreshGoalProgress,
  setWaterTarget,
  exportFastsCSV,
  exportWeightCSV,
} from '@mylife/fast';
import type { NotificationPreferences, Goal, GoalProgress } from '@mylife/fast';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { getHealthSyncStatus, probeHealthSyncStatus, syncHealthData } from '../../lib/health-sync';

interface WeeklyGoalState {
  goal: Goal | null;
  target: number;
  history: GoalProgress[];
}

function settingBool(value: string | null, fallback = false): boolean {
  if (value == null) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

function loadWeeklyGoal(db: ReturnType<typeof useDatabase>): WeeklyGoalState {
  const goals = listGoals(db, true);
  const weekly = goals.find((goal) => goal.type === 'fasts_per_week' && goal.isActive) ?? null;
  if (!weekly) {
    return { goal: null, target: 5, history: [] };
  }

  return {
    goal: weekly,
    target: Math.max(1, Math.round(weekly.targetValue)),
    history: listGoalProgress(db, weekly.id, 8),
  };
}

export default function FastSettingsScreen() {
  const db = useDatabase();

  const [defaultProtocol, setDefaultProtocol] = useState(
    getSetting(db, 'defaultProtocol') ?? '16:8',
  );
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    getNotificationPreferences(db),
  );
  const [waterTarget, setWaterTargetState] = useState(() => {
    const value = Number(getSetting(db, 'waterDailyTarget') ?? '8');
    return Number.isFinite(value) ? Math.max(1, Math.round(value)) : 8;
  });
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoalState>(() => loadWeeklyGoal(db));
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(
    settingBool(getSetting(db, 'healthSyncEnabled'), false),
  );
  const [healthReadWeight, setHealthReadWeight] = useState(
    settingBool(getSetting(db, 'healthReadWeight'), false),
  );
  const [healthWriteFasts, setHealthWriteFasts] = useState(
    settingBool(getSetting(db, 'healthWriteFasts'), false),
  );
  const [healthStatus, setHealthStatus] = useState(() => getHealthSyncStatus());

  useEffect(() => {
    let mounted = true;
    void probeHealthSyncStatus().then((status) => {
      if (!mounted) return;
      setHealthStatus(status);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const save = () => {
    setSetting(db, 'defaultProtocol', defaultProtocol.trim() || '16:8');
    setSetting(db, 'healthSyncEnabled', healthSyncEnabled ? '1' : '0');
    setSetting(db, 'healthReadWeight', healthReadWeight ? '1' : '0');
    setSetting(db, 'healthWriteFasts', healthWriteFasts ? '1' : '0');

    if (weeklyGoal.goal) {
      upsertGoal(db, {
        ...weeklyGoal.goal,
        targetValue: weeklyGoal.target,
      });
    } else {
      createGoal(db, {
        type: 'fasts_per_week',
        targetValue: weeklyGoal.target,
        label: 'Weekly fasting goal',
        unit: 'fasts',
      });
    }

    refreshGoalProgress(db);
    setWeeklyGoal(loadWeeklyGoal(db));
  };

  const adjustWaterTarget = (delta: number) => {
    const next = Math.max(1, waterTarget + delta);
    const updated = setWaterTarget(db, next);
    setWaterTargetState(updated.target);
  };

  const updateNotification = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
    setNotificationPreference(db, key, value);
  };

  const handleSyncHealth = useCallback(async () => {
    if (!healthSyncEnabled) {
      Alert.alert('Health Sync', 'Enable health sync first to run import/export.');
      return;
    }

    const result = await syncHealthData(db, {
      readWeight: healthReadWeight,
      writeFasts: healthWriteFasts,
    });

    Alert.alert('Health Sync', result.message);
  }, [db, healthReadWeight, healthSyncEnabled, healthWriteFasts]);

  const handleExport = useCallback(() => {
    const fastsCSV = exportFastsCSV(db);
    const weightCSV = exportWeightCSV(db);
    const combined = `=== Fasts ===\n${fastsCSV}\n=== Weight Entries ===\n${weightCSV}`;
    void Share.share({ message: combined, title: 'MyFast Export' });
  }, [db]);

  const handleEraseData = useCallback(() => {
    Alert.alert(
      'Erase All Data',
      'This will permanently delete all fasts, water logs, goals, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: () => {
            db.execute('DELETE FROM ft_fasts');
            db.execute('DELETE FROM ft_active_fast');
            db.execute('DELETE FROM ft_weight_entries');
            db.execute('DELETE FROM ft_water_intake');
            db.execute('DELETE FROM ft_goals');
            db.execute('DELETE FROM ft_goal_progress');
            db.execute('DELETE FROM ft_notifications_config');
            db.execute('DELETE FROM ft_streak_cache');
            db.execute('DELETE FROM ft_settings');
            Alert.alert('Done', 'All MyFast data has been erased.');
          },
        },
      ],
    );
  }, [db]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Timer Defaults</Text>
        <View style={styles.formRow}>
          <Text variant="caption" color={colors.textSecondary}>Default protocol</Text>
          <TextInput
            style={styles.input}
            value={defaultProtocol}
            onChangeText={setDefaultProtocol}
            placeholder="16:8"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Notifications</Text>
        <ToggleRow
          label="Fast started"
          value={notificationPrefs.fastStart}
          onChange={(value) => updateNotification('fastStart', value)}
        />
        <ToggleRow
          label="25% progress"
          value={notificationPrefs.progress25}
          onChange={(value) => updateNotification('progress25', value)}
        />
        <ToggleRow
          label="50% progress"
          value={notificationPrefs.progress50}
          onChange={(value) => updateNotification('progress50', value)}
        />
        <ToggleRow
          label="75% progress"
          value={notificationPrefs.progress75}
          onChange={(value) => updateNotification('progress75', value)}
        />
        <ToggleRow
          label="Fast complete"
          value={notificationPrefs.fastComplete}
          onChange={(value) => updateNotification('fastComplete', value)}
        />
      </Card>

      <Card>
        <Text variant="subheading">Hydration</Text>
        <View style={styles.rowBetween}>
          <Text variant="body">Daily target</Text>
          <View style={styles.adjustControls}>
            <Pressable style={styles.adjustButton} onPress={() => adjustWaterTarget(-1)}>
              <Text variant="label">-</Text>
            </Pressable>
            <Text style={styles.targetValue}>{waterTarget}</Text>
            <Pressable style={styles.adjustButton} onPress={() => adjustWaterTarget(1)}>
              <Text variant="label">+</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Goals</Text>
        <View style={styles.rowBetween}>
          <Text variant="body">Fasts per week</Text>
          <View style={styles.adjustControls}>
            <Pressable
              style={styles.adjustButton}
              onPress={() =>
                setWeeklyGoal((prev) => ({
                  ...prev,
                  target: Math.max(1, prev.target - 1),
                }))
              }
            >
              <Text variant="label">-</Text>
            </Pressable>
            <Text style={styles.targetValue}>{weeklyGoal.target}</Text>
            <Pressable
              style={styles.adjustButton}
              onPress={() =>
                setWeeklyGoal((prev) => ({
                  ...prev,
                  target: Math.min(14, prev.target + 1),
                }))
              }
            >
              <Text variant="label">+</Text>
            </Pressable>
          </View>
        </View>

        {weeklyGoal.history.slice(0, 3).map((entry) => (
          <View key={entry.id} style={styles.rowBetweenMini}>
            <Text variant="caption" color={colors.textSecondary}>{entry.periodStart} - {entry.periodEnd}</Text>
            <Text variant="caption" color={entry.completed ? colors.success : colors.text}>{entry.currentValue}/{entry.targetValue}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="subheading">Health Integration</Text>
        <ToggleRow
          label="Enable health sync"
          value={healthSyncEnabled}
          onChange={setHealthSyncEnabled}
        />
        <ToggleRow
          label="Read weight entries"
          value={healthReadWeight}
          onChange={setHealthReadWeight}
        />
        <ToggleRow
          label="Write fasting windows"
          value={healthWriteFasts}
          onChange={setHealthWriteFasts}
        />
        <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
          {healthStatus.reason}
        </Text>
        <Pressable style={[styles.primaryButton, { marginTop: spacing.sm }]} onPress={() => void handleSyncHealth()}>
          <Text variant="label" color={colors.background}>Sync Health Now</Text>
        </Pressable>
      </Card>

      <Pressable style={styles.primaryButton} onPress={save}>
        <Text variant="label" color={colors.background}>Save Settings</Text>
      </Pressable>

      <Card>
        <Text variant="subheading">Data</Text>
        <Pressable style={[styles.primaryButton, { marginTop: spacing.sm }]} onPress={handleExport}>
          <Text variant="label" color={colors.background}>Export as CSV</Text>
        </Pressable>
        <Pressable
          style={[styles.dangerButton, { marginTop: spacing.sm }]}
          onPress={handleEraseData}
        >
          <Text variant="label" color={colors.background}>Erase All Data</Text>
        </Pressable>
      </Card>

      <Card>
        <Text variant="subheading">About</Text>
        <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          MyFast v0.1.0
        </Text>
        <Text variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.xs }}>
          All data stored locally on your device. No accounts, no servers, no tracking.
        </Text>
      </Card>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text variant="body">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceElevated, true: colors.modules.fast }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  formRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  switchRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBetween: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBetweenMini: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  targetValue: {
    color: colors.modules.fast,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: colors.modules.fast,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerButton: {
    borderRadius: 10,
    backgroundColor: '#E8725C',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
