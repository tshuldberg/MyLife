import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { formatCents, loadSubsDashboard } from './helpers';

const CATEGORY_LABELS: Record<string, string> = {
  entertainment: 'Entertainment',
  productivity: 'Productivity',
  health: 'Health',
  shopping: 'Shopping',
  news: 'News',
  finance: 'Finance',
  utilities: 'Utilities',
  other: 'Other',
};

export default function SubsDashboardScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const { summary, upcoming } = useMemo(() => loadSubsDashboard(db, 14), [db, tick]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Monthly" value={formatCents(summary.monthlyTotal)} highlight />
        <Metric label="Annual" value={formatCents(summary.annualTotal)} />
        <Metric label="Daily" value={formatCents(summary.dailyCost)} />
      </View>

      <Card>
        <Text variant="caption" color={colors.textSecondary}>
          {summary.activeCount} active of {summary.totalCount} total subscriptions
        </Text>
      </Card>

      <Card>
        <Text variant="subheading">By Category</Text>
        <FlatList
          data={summary.byCategory}
          keyExtractor={(item) => item.category ?? 'none'}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => {
            const pct = summary.monthlyTotal > 0 ? (item.monthlyCost / summary.monthlyTotal) * 100 : 0;
            return (
              <View style={styles.categoryRow}>
                <View style={styles.rowBetween}>
                  <Text variant="body">{CATEGORY_LABELS[item.category ?? ''] ?? 'Other'}</Text>
                  <Text variant="label" color={colors.modules.subs}>{formatCents(item.monthlyCost)}/mo</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text variant="caption" color={colors.textTertiary}>
                  {item.count} subscription{item.count === 1 ? '' : 's'}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text variant="caption" color={colors.textSecondary}>No subscriptions yet.</Text>
          }
        />
      </Card>

      <Card>
        <Text variant="subheading">Upcoming Renewals (14 days)</Text>
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.rowBetween}>
              <View style={styles.mainCopy}>
                <Text variant="body">{item.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>Renews {item.next_renewal}</Text>
              </View>
              <Text variant="label" color={colors.modules.subs}>{formatCents(item.price)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text variant="caption" color={colors.textSecondary}>No upcoming renewals.</Text>
          }
        />
      </Card>

      <Card>
        <Text variant="caption" color={colors.textSecondary} onPress={refresh}>
          Pull-to-refresh equivalent: tap here to reload
        </Text>
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={[styles.metricValue, highlight ? styles.metricValueHighlight : null]}>{value}</Text>
    </Card>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '31.5%',
    minWidth: 95,
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  metricValueHighlight: {
    color: colors.modules.subs,
  },
  list: {
    marginTop: spacing.sm,
  },
  categoryRow: {
    marginBottom: spacing.sm,
    gap: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  barTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.modules.subs,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
});
