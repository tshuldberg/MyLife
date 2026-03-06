import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getSubscriptions,
  normalizeToMonthly,
  normalizeToAnnual,
  type BudgetSubscription,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: string): string {
  if (status === 'active') return colors.success;
  if (status === 'trial') return BUDGET_ACCENT;
  if (status === 'paused') return colors.textTertiary;
  return colors.danger;
}

function billingLabel(cycle: string): string {
  return cycle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Section {
  title: string;
  data: BudgetSubscription[];
}

function groupByStatus(subs: BudgetSubscription[]): Section[] {
  const active = subs.filter((s) => s.status === 'active');
  const trial = subs.filter((s) => s.status === 'trial');
  const paused = subs.filter((s) => s.status === 'paused');
  const cancelled = subs.filter((s) => s.status === 'cancelled');

  const sections: Section[] = [];
  if (active.length > 0) sections.push({ title: 'Active', data: active });
  if (trial.length > 0) sections.push({ title: 'Trial', data: trial });
  if (paused.length > 0) sections.push({ title: 'Paused', data: paused });
  if (cancelled.length > 0) sections.push({ title: 'Cancelled', data: cancelled });
  return sections;
}

export default function BudgetSubscriptionsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [subscriptions, setSubscriptions] = useState<BudgetSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      setSubscriptions(getSubscriptions(db));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.status === 'active' || s.status === 'trial'),
    [subscriptions],
  );

  const monthlyTotal = useMemo(
    () => activeSubs.reduce((sum, s) => sum + normalizeToMonthly(s.price, s.billing_cycle, s.custom_days), 0),
    [activeSubs],
  );

  const annualTotal = useMemo(
    () => activeSubs.reduce((sum, s) => sum + normalizeToAnnual(s.price, s.billing_cycle, s.custom_days), 0),
    [activeSubs],
  );

  const sections = useMemo(() => groupByStatus(subscriptions), [subscriptions]);
  const flatData = useMemo(() => {
    const result: Array<{ type: 'header'; title: string } | { type: 'item'; item: BudgetSubscription }> = [];
    for (const section of sections) {
      result.push({ type: 'header', title: section.title });
      for (const item of section.data) {
        result.push({ type: 'item', item });
      }
    }
    return result;
  }, [sections]);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <View style={styles.costRow}>
            <View style={styles.costItem}>
              <Text style={styles.costAmount}>{formatCurrency(monthlyTotal)}</Text>
              <Text variant="caption" color={colors.textSecondary}>per month</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costItem}>
              <Text style={styles.costAmount}>{formatCurrency(annualTotal)}</Text>
              <Text variant="caption" color={colors.textSecondary}>per year</Text>
            </View>
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            {activeSubs.length} active of {subscriptions.length} total
          </Text>
        </Card>
      </View>

      <View style={styles.actionsRow}>
        <Button
          variant="primary"
          label="Add Subscription"
          onPress={() => router.push('/(budget)/subscription/add')}
          style={styles.actionButton}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text variant="caption" color={colors.danger}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>Loading subscriptions...</Text>
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            No subscriptions yet. Add one to start tracking.
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(entry, index) => entry.type === 'header' ? `header-${entry.title}` : entry.item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BUDGET_ACCENT}
              colors={[BUDGET_ACCENT]}
            />
          }
          renderItem={({ item: entry }) => {
            if (entry.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text variant="label" color={colors.textTertiary}>
                    {entry.title.toUpperCase()}
                  </Text>
                </View>
              );
            }

            const sub = entry.item;
            const monthly = normalizeToMonthly(sub.price, sub.billing_cycle, sub.custom_days);

            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/(budget)/subscription/${sub.id}` as never)}
              >
                <Card style={styles.rowCard}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconPill}>
                      <Text style={styles.iconText}>{sub.icon ?? '\u{1F4B3}'}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text variant="subheading">{sub.name}</Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        {formatCurrency(sub.price)}/{billingLabel(sub.billing_cycle)}
                      </Text>
                      <Text variant="caption" color={statusColor(sub.status)}>
                        {statusLabel(sub.status)}
                        {sub.next_renewal && sub.status !== 'cancelled' ? ` - Renews ${sub.next_renewal}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.monthlyValue}>{formatCurrency(monthly)}/mo</Text>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  summaryCard: {
    borderLeftWidth: 3,
    borderLeftColor: BUDGET_ACCENT,
    gap: spacing.sm,
    alignItems: 'center',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  costItem: {
    alignItems: 'center',
  },
  costAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: BUDGET_ACCENT,
  },
  costDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  errorBox: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    marginBottom: spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  monthlyValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
  },
});
