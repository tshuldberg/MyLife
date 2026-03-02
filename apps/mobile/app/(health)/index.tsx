import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  getActiveMedications,
  getDoseLogsForDate,
  getMoodEntriesForDate,
  getLatestVital,
  getLastNightSleep,
  getActiveGoals,
} from '@mylife/health';
import { getActiveFast, type ActiveFast } from '@mylife/fast';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;
const today = new Date().toISOString().slice(0, 10);

export default function HealthTodayScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick] = useState(0);

  // Active fast (from ft_ tables via @mylife/fast)
  const activeFast = useMemo(() => {
    try { return getActiveFast(db); } catch { return null; }
  }, [db, tick]) as ActiveFast | null;

  // Medications due today
  const medications = useMemo(() => {
    try { return getActiveMedications(db); } catch { return []; }
  }, [db, tick]);

  const todayDoses = useMemo(() => {
    try { return getDoseLogsForDate(db, today); } catch { return []; }
  }, [db, tick]);

  // Mood
  const todayMood = useMemo(() => {
    try {
      const entries = getMoodEntriesForDate(db, today);
      return entries.length > 0 ? entries[entries.length - 1] : null;
    } catch { return null; }
  }, [db, tick]);

  // Vitals
  const latestSteps = useMemo(() => {
    try { return getLatestVital(db, 'steps'); } catch { return null; }
  }, [db, tick]);

  const latestHR = useMemo(() => {
    try { return getLatestVital(db, 'heart_rate'); } catch { return null; }
  }, [db, tick]);

  // Sleep
  const lastSleep = useMemo(() => {
    try { return getLastNightSleep(db); } catch { return null; }
  }, [db, tick]);

  // Goals
  const activeGoals = useMemo(() => {
    try { return getActiveGoals(db); } catch { return []; }
  }, [db, tick]);

  const pendingMeds = medications.length - todayDoses.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text variant="heading" style={styles.greeting}>
        Today
      </Text>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/(health)/fasting')}
        >
          <Text style={styles.actionEmoji}>⏱️</Text>
          <Text variant="caption">Fast</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/(health)/mood-check-in')}
        >
          <Text style={styles.actionEmoji}>😊</Text>
          <Text variant="caption">Mood</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/(health)/measurement-log')}
        >
          <Text style={styles.actionEmoji}>📏</Text>
          <Text variant="caption">Measure</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/(health)/add-goal')}
        >
          <Text style={styles.actionEmoji}>🎯</Text>
          <Text variant="caption">Goal</Text>
        </Pressable>
      </View>

      {/* Active Fast */}
      <Card style={styles.card}>
        <Text variant="subheading">Fasting</Text>
        {activeFast ? (
          <View style={styles.cardRow}>
            <Text style={[styles.metricValue, { color: ACCENT }]}>
              Active
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              {activeFast.protocol} protocol
            </Text>
          </View>
        ) : (
          <Text variant="caption" color={colors.textSecondary}>
            No active fast
          </Text>
        )}
      </Card>

      {/* Medications */}
      <Card style={styles.card}>
        <Text variant="subheading">Medications</Text>
        {medications.length > 0 ? (
          <View style={styles.cardRow}>
            <Text style={[styles.metricValue, { color: ACCENT }]}>
              {todayDoses.length}/{medications.length}
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              {pendingMeds > 0
                ? `${pendingMeds} dose${pendingMeds === 1 ? '' : 's'} remaining`
                : 'All doses taken'}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color={colors.textSecondary}>
            No medications tracked
          </Text>
        )}
      </Card>

      {/* Vitals Snapshot */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Steps</Text>
          <Text style={[styles.metricValue, { color: ACCENT }]}>
            {latestSteps ? Math.round(latestSteps.value).toLocaleString() : '--'}
          </Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Heart Rate</Text>
          <Text style={[styles.metricValue, { color: ACCENT }]}>
            {latestHR ? `${Math.round(latestHR.value)}` : '--'}
          </Text>
          {latestHR && (
            <Text variant="caption" color={colors.textSecondary}>bpm</Text>
          )}
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Sleep</Text>
          <Text style={[styles.metricValue, { color: ACCENT }]}>
            {lastSleep
              ? `${Math.floor(lastSleep.duration_minutes / 60)}h ${lastSleep.duration_minutes % 60}m`
              : '--'}
          </Text>
          {lastSleep && lastSleep.quality_score != null && (
            <Text variant="caption" color={colors.textSecondary}>
              Score: {lastSleep.quality_score}
            </Text>
          )}
        </Card>
      </View>

      {/* Mood */}
      <Card style={styles.card}>
        <Text variant="subheading">Mood</Text>
        {todayMood ? (
          <View style={styles.cardRow}>
            <Text style={[styles.metricValue, { color: ACCENT }]}>
              {String((todayMood as Record<string, unknown>).mood_label ?? 'Logged')}
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Latest check-in
            </Text>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/(health)/mood-check-in')}>
            <Text variant="caption" color={ACCENT}>
              Tap to log your mood
            </Text>
          </Pressable>
        )}
      </Card>

      {/* Goals */}
      {activeGoals.length > 0 && (
        <Card style={styles.card}>
          <Text variant="subheading">Goals</Text>
          {activeGoals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={styles.goalRow}>
              <Text variant="body">
                {goal.label ?? `${goal.domain}: ${goal.metric}`}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Target: {goal.target_value} {goal.unit ?? ''}
              </Text>
            </View>
          ))}
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
    gap: spacing.sm,
  },
  greeting: {
    marginBottom: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  card: {},
  cardRow: {
    gap: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  goalRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
