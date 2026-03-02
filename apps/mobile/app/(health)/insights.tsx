import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  getMoodEntries,
  getMoodEntriesForDate,
  getMoodCalendarMonth,
  getActiveMedications,
  getOverallWellnessTimeline,
  getOverallStats,
  moodColor,
  getLastNightSleep,
  getSleepSessions,
  type WellnessTimelineEntry,
} from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;
const today = new Date().toISOString().slice(0, 10);

export default function InsightsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick] = useState(0);

  // --- Mood ---
  const todayMood = useMemo(() => {
    try {
      const entries = getMoodEntriesForDate(db, today);
      return entries.length > 0 ? entries[entries.length - 1] : null;
    } catch { return null; }
  }, [db, tick]);

  const recentMoods = useMemo(() => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return getMoodEntries(db, weekAgo.toISOString().slice(0, 10));
    } catch { return []; }
  }, [db, tick]);

  const moodCalendar = useMemo(() => {
    try {
      const now = new Date();
      return getMoodCalendarMonth(db, now.getFullYear(), now.getMonth() + 1);
    } catch { return []; }
  }, [db, tick]);

  // --- Wellness Timeline ---
  const timeline = useMemo(() => {
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 14);
      return getOverallWellnessTimeline(
        db,
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
      );
    } catch { return [] as WellnessTimelineEntry[]; }
  }, [db, tick]);

  // --- Overall stats ---
  const stats = useMemo(() => {
    try { return getOverallStats(db); } catch { return null; }
  }, [db, tick]);

  // --- Medications (for correlation) ---
  const medications = useMemo(() => {
    try { return getActiveMedications(db); } catch { return []; }
  }, [db, tick]);

  // --- Sleep trends ---
  const recentSleep = useMemo(() => {
    try { return getSleepSessions(db, 7); } catch { return []; }
  }, [db, tick]);

  const lastSleep = useMemo(() => {
    try { return getLastNightSleep(db); } catch { return null; }
  }, [db, tick]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mood Section */}
      <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        Mood
      </Text>
      <Card style={styles.card}>
        {todayMood ? (
          <View style={styles.moodRow}>
            <View
              style={[
                styles.moodDot,
                { backgroundColor: moodColor(todayMood.pleasantness === 'neutral' ? null : todayMood.pleasantness) },
              ]}
            />
            <View style={styles.flex1}>
              <Text variant="subheading">{todayMood.mood}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Today's check-in
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(health)/mood-check-in' as never)}>
              <Text variant="caption" color={ACCENT}>Update</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/(health)/mood-check-in' as never)}>
            <Text variant="caption" color={ACCENT}>
              Tap to log your mood
            </Text>
          </Pressable>
        )}
      </Card>

      {/* Mood Calendar (mini) */}
      {moodCalendar.length > 0 && (
        <Card style={styles.card}>
          <Text variant="caption" color={colors.textSecondary}>
            This Month
          </Text>
          <View style={styles.calendarGrid}>
            {moodCalendar.slice(-14).map((day, i) => (
              <View
                key={i}
                style={[
                  styles.calendarDot,
                  { backgroundColor: day.hasData ? day.color : colors.surfaceElevated },
                ]}
              />
            ))}
          </View>
        </Card>
      )}

      {/* Recent Moods */}
      {recentMoods.length > 0 && (
        <Card style={styles.card}>
          <Text variant="caption" color={colors.textSecondary}>
            Recent Entries
          </Text>
          {recentMoods.slice(0, 5).map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <View
                style={[
                  styles.moodDotSmall,
                  { backgroundColor: moodColor(entry.pleasantness === 'neutral' ? null : entry.pleasantness) },
                ]}
              />
              <Text variant="body" style={styles.flex1}>
                {entry.mood}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                {entry.recordedAt?.slice(0, 10) ?? ''}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Sleep vs Mood */}
      {lastSleep && recentSleep.length > 0 && (
        <>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
            Sleep Trends
          </Text>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              7-day avg:{' '}
              {(recentSleep.reduce((s, r) => s + r.duration_minutes, 0) / recentSleep.length / 60).toFixed(1)}h
            </Text>
            {lastSleep.quality_score != null && (
              <Text variant="caption" color={colors.textSecondary}>
                Last night quality: {lastSleep.quality_score}/100
              </Text>
            )}
          </Card>
        </>
      )}

      {/* Wellness Timeline */}
      <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        Wellness Timeline
      </Text>
      {timeline.length > 0 ? (
        <Card style={styles.card}>
          {timeline.slice(0, 7).map((entry, i) => (
            <View key={i} style={styles.timelineRow}>
              <Text variant="caption" color={colors.textSecondary} style={styles.timelineDate}>
                {entry.date.slice(5)}
              </Text>
              <View style={styles.timelineBars}>
                {entry.moodScore != null && (
                  <View
                    style={[
                      styles.timelineBar,
                      {
                        backgroundColor: entry.moodScore >= 0 ? '#4CAF50' : '#F44336',
                        width: `${Math.round(Math.abs(entry.moodScore) * 100)}%`,
                      },
                    ]}
                  />
                )}
              </View>
              <Text variant="caption" color={colors.textSecondary}>
                {entry.adherenceRate}%
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text variant="caption" color={colors.textSecondary}>
            Your wellness trends will appear here as you log data
          </Text>
        </Card>
      )}

      {/* Overall Stats */}
      {stats && (
        <>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
            Overall (30d)
          </Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary}>Adherence</Text>
              <Text style={[styles.statValue, { color: ACCENT }]}>
                {stats.overallAdherence30d}%
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary}>Mood Entries</Text>
              <Text style={[styles.statValue, { color: ACCENT }]}>
                {stats.moodEntries30d}
              </Text>
            </Card>
          </View>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary}>Active Meds</Text>
              <Text style={[styles.statValue, { color: ACCENT }]}>
                {stats.activeMedications}
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text variant="caption" color={colors.textSecondary}>Symptoms</Text>
              <Text style={[styles.statValue, { color: ACCENT }]}>
                {stats.symptomEntries30d}
              </Text>
            </Card>
          </View>
        </>
      )}

      {/* Medications for deeper correlation */}
      {medications.length > 0 && (
        <>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
            Medication Insights
          </Text>
          <Card style={styles.card}>
            <Text variant="caption" color={colors.textSecondary}>
              Tracking {medications.length} active medication{medications.length === 1 ? '' : 's'}.
              Log mood and symptoms consistently to unlock correlations.
            </Text>
          </Card>
        </>
      )}

      {/* Export */}
      <Pressable
        style={styles.exportLink}
        onPress={() => router.push('/(health)/export' as never)}
      >
        <Text variant="caption" color={ACCENT}>Export Reports</Text>
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
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  moodDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  calendarDot: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timelineDate: {
    width: 40,
  },
  timelineBars: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  timelineBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  exportLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
});
