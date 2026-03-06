import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  listEnvelopes,
  listTransactions,
  getSubscriptions,
  normalizeToMonthly,
  normalizeToAnnual,
  type BudgetTransaction,
  type Envelope,
  type BudgetSubscription,
} from '@mylife/budget';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

type TimePeriod = 'month' | 'quarter' | 'year';

function formatCurrency(cents: number): string {
  return `$${(Math.abs(cents) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-31`,
  };
}

function currentQuarterRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3 + 1;
  return {
    from: `${y}-${String(startMonth).padStart(2, '0')}-01`,
    to: `${y}-${String(startMonth + 2).padStart(2, '0')}-31`,
  };
}

function currentYearRange(): { from: string; to: string } {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

function rangeForPeriod(period: TimePeriod): { from: string; to: string } {
  if (period === 'quarter') return currentQuarterRange();
  if (period === 'year') return currentYearRange();
  return currentMonthRange();
}

interface EnvelopeSpending {
  name: string;
  icon: string;
  amount: number;
  percent: number;
}

function computeEnvelopeSpending(
  transactions: BudgetTransaction[],
  envelopes: Envelope[],
): EnvelopeSpending[] {
  const envelopeMap = new Map(envelopes.map((e) => [e.id, e]));
  const spendByEnvelope = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.direction !== 'outflow') continue;
    const envId = tx.envelope_id ?? '__uncategorized__';
    spendByEnvelope.set(envId, (spendByEnvelope.get(envId) ?? 0) + tx.amount);
  }

  const totalSpending = Array.from(spendByEnvelope.values()).reduce((a, b) => a + b, 0);

  const result: EnvelopeSpending[] = [];
  for (const [envId, amount] of spendByEnvelope.entries()) {
    const env = envelopeMap.get(envId);
    result.push({
      name: env?.name ?? 'Uncategorized',
      icon: env?.icon ?? '\u{1F4BC}',
      amount,
      percent: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export default function BudgetReportsScreen() {
  const db = useDatabase();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [period, setPeriod] = useState<TimePeriod>('month');
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [subscriptions, setSubscriptions] = useState<BudgetSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    try {
      const range = rangeForPeriod(period);
      setTransactions(listTransactions(db, { from_date: range.from, to_date: range.to, limit: 500 }));
      setEnvelopes(listEnvelopes(db, true));
      setSubscriptions(getSubscriptions(db, { status: 'active' }));
    } catch {
      // Silently handle load errors
    } finally {
      setLoading(false);
    }
  }, [db, period]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.direction === 'inflow').reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  const totalSpending = useMemo(
    () => transactions.filter((t) => t.direction === 'outflow').reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  const netSavings = totalIncome - totalSpending;

  const envelopeSpending = useMemo(
    () => computeEnvelopeSpending(transactions, envelopes),
    [transactions, envelopes],
  );

  const subMonthly = useMemo(
    () => subscriptions.reduce((sum, s) => sum + normalizeToMonthly(s.price, s.billing_cycle, s.custom_days), 0),
    [subscriptions],
  );

  const subAnnual = useMemo(
    () => subscriptions.reduce((sum, s) => sum + normalizeToAnnual(s.price, s.billing_cycle, s.custom_days), 0),
    [subscriptions],
  );

  const periodOptions: { value: TimePeriod; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.toggle}>
        {periodOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setPeriod(opt.value)}
            style={[styles.toggleBtn, period === opt.value ? styles.toggleBtnActive : null]}
          >
            <Text
              variant="caption"
              color={period === opt.value ? colors.background : colors.textSecondary}
              style={period === opt.value ? styles.toggleTextActive : null}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text variant="body" color={colors.textSecondary}>Loading reports...</Text>
        </View>
      ) : (
        <>
          <Card style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text variant="caption" color={colors.textTertiary}>Income</Text>
                <Text style={styles.incomeAmount}>{formatCurrency(totalIncome)}</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewItem}>
                <Text variant="caption" color={colors.textTertiary}>Spending</Text>
                <Text style={styles.spendingAmount}>{formatCurrency(totalSpending)}</Text>
              </View>
            </View>
            <View style={styles.savingsRow}>
              <Text variant="body">Net Savings</Text>
              <Text style={[styles.savingsAmount, netSavings >= 0 ? styles.positive : styles.negative]}>
                {netSavings >= 0 ? '+' : '-'}{formatCurrency(netSavings)}
              </Text>
            </View>
          </Card>

          <Text variant="label" color={colors.textTertiary} style={styles.sectionHeader}>
            SPENDING BY ENVELOPE
          </Text>
          {envelopeSpending.length === 0 ? (
            <Card>
              <Text variant="caption" color={colors.textSecondary}>
                No spending transactions in this period.
              </Text>
            </Card>
          ) : (
            <Card style={styles.categoryCard}>
              {envelopeSpending.map((cat, index) => (
                <View key={cat.name}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text variant="body" numberOfLines={1} style={styles.categoryName}>
                        {cat.name}
                      </Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                      <Text variant="caption" color={colors.textTertiary}>{cat.percent}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${cat.percent}%` }]} />
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Text variant="label" color={colors.textTertiary} style={styles.sectionHeader}>
            SUBSCRIPTION COSTS
          </Text>
          <Card>
            <View style={styles.subRow}>
              <Text variant="body">Monthly</Text>
              <Text style={styles.subAmount}>{formatCurrency(subMonthly)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.subRow}>
              <Text variant="body">Annual Projection</Text>
              <Text style={styles.subAmount}>{formatCurrency(subAnnual)}</Text>
            </View>
          </Card>
        </>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 2,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: BUDGET_ACCENT,
  },
  toggleTextActive: {
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  overviewCard: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  incomeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  spendingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.danger,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryCard: {
    gap: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  categoryName: {
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  progressTrack: {
    marginTop: 4,
    marginBottom: spacing.sm,
    width: '100%',
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BUDGET_ACCENT,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  subAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
