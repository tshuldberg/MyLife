import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { getStreaks, listFasts, type Fast } from '@mylife/fast';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function byMonth(fasts: Fast[]): Array<{ key: string; items: Fast[] }> {
  const map = new Map<string, Fast[]>();
  for (const fast of fasts) {
    const d = new Date(fast.startedAt);
    const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const bucket = map.get(key) ?? [];
    bucket.push(fast);
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

export default function FastHistoryScreen() {
  const db = useDatabase();
  const fasts = listFasts(db, { limit: 250 });
  const streaks = getStreaks(db);

  const groups = useMemo(() => byMonth(fasts), [fasts]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={
        <Card style={styles.summaryCard}>
          <Text variant="subheading">History</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {fasts.length} completed fasts · current streak {streaks.currentStreak}
          </Text>
        </Card>
      }
      renderItem={({ item }) => (
        <View style={styles.group}>
          <Text variant="label" color={colors.textSecondary}>
            {item.key}
          </Text>
          <View style={styles.list}>
            {item.items.map((fast) => (
              <Card key={fast.id}>
                <View style={styles.rowBetween}>
                  <Text variant="body">{fast.protocol}</Text>
                  <Text
                    variant="label"
                    color={fast.hitTarget ? colors.success : colors.textSecondary}
                  >
                    {fast.hitTarget ? 'Hit Target' : 'Ended Early'}
                  </Text>
                </View>
                <Text variant="caption" color={colors.textSecondary}>
                  {new Date(fast.startedAt).toLocaleDateString()} ·{' '}
                  {new Date(fast.startedAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                {fast.durationSeconds != null ? (
                  <Text style={styles.duration}>{Math.round(fast.durationSeconds / 3600)}h</Text>
                ) : null}
              </Card>
            ))}
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text variant="body" color={colors.textSecondary}>
            No fasts yet. Start your first one on the Timer tab.
          </Text>
        </View>
      }
    />
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
  summaryCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  group: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  duration: {
    marginTop: spacing.xs,
    color: colors.modules.fast,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
