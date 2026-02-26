import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { formatCents, loadSubsDashboard } from './helpers';

interface MonthGroup {
  key: string;
  month: string;
  items: ReturnType<typeof loadSubsDashboard>['upcoming'];
}

function groupByMonth(upcoming: ReturnType<typeof loadSubsDashboard>['upcoming']): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const item of upcoming) {
    const date = new Date(item.next_renewal);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const month = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const group = map.get(key) ?? { key, month, items: [] };
    group.items.push(item);
    map.set(key, group);
  }
  return Array.from(map.values());
}

export default function SubsCalendarScreen() {
  const db = useDatabase();
  const { upcoming } = loadSubsDashboard(db, 90);
  const groups = useMemo(() => groupByMonth(upcoming), [upcoming]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Renewal Calendar</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Next 90 days · {upcoming.length} upcoming renewal{upcoming.length === 1 ? '' : 's'}
        </Text>
      </Card>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.key}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card style={styles.monthCard}>
            <Text variant="label" color={colors.modules.subs}>{item.month}</Text>
            <View style={styles.monthList}>
              {item.items.map((sub) => (
                <View key={sub.id} style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{sub.name}</Text>
                    <Text variant="caption" color={colors.textSecondary}>{sub.next_renewal}</Text>
                  </View>
                  <Text variant="label" color={colors.modules.subs}>{formatCents(sub.price)}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>No renewals in the next 90 days.</Text>
          </View>
        }
      />
    </ScrollView>
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
  monthCard: {
    marginTop: spacing.sm,
  },
  monthList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
