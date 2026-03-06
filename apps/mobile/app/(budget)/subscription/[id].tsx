import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getSubscriptionById,
  pauseSubscription,
  cancelSubscription,
  resumeSubscription,
  deleteSubscription,
  normalizeToMonthly,
  normalizeToAnnual,
  type BudgetSubscription,
} from '@mylife/budget';
import { Button, Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function billingLabel(cycle: string): string {
  return cycle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="caption" color={colors.textTertiary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

export default function BudgetSubscriptionDetailScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const subId = Array.isArray(id) ? id[0] : id;

  const [sub, setSub] = useState<BudgetSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!subId) {
      setError('Subscription not found.');
      setLoading(false);
      return;
    }

    try {
      const found = getSubscriptionById(db, subId);
      if (!found) {
        setError('Subscription not found.');
      } else {
        setSub(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription.');
    } finally {
      setLoading(false);
    }
  }, [db, subId]);

  const goToList = () => {
    router.replace(`/(budget)/subscriptions?refresh=${Date.now()}` as never);
  };

  const monthly = useMemo(
    () => sub ? normalizeToMonthly(sub.price, sub.billing_cycle, sub.custom_days) : 0,
    [sub],
  );

  const annual = useMemo(
    () => sub ? normalizeToAnnual(sub.price, sub.billing_cycle, sub.custom_days) : 0,
    [sub],
  );

  const handlePause = () => {
    if (!subId || submitting) return;
    Alert.alert('Pause Subscription', `Pause ${sub?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pause',
        onPress: () => {
          setSubmitting(true);
          try {
            pauseSubscription(db, subId);
            goToList();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to pause.');
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleResume = () => {
    if (!subId || submitting) return;
    setSubmitting(true);
    try {
      resumeSubscription(db, subId);
      goToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume.');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!subId || submitting) return;
    Alert.alert('Cancel Subscription', `Cancel ${sub?.name}? This cannot be undone.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Subscription',
        style: 'destructive',
        onPress: () => {
          setSubmitting(true);
          try {
            cancelSubscription(db, subId);
            goToList();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel.');
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!subId || submitting) return;
    Alert.alert('Delete Subscription', 'Delete this subscription record? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setSubmitting(true);
          try {
            deleteSubscription(db, subId);
            goToList();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete.');
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.textSecondary}>Loading subscription...</Text>
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.danger}>{error ?? 'Subscription not found.'}</Text>
        <View style={styles.emptyActions}>
          <Button variant="secondary" label="Back to Subscriptions" onPress={goToList} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {sub.icon ? <Text style={styles.headerIcon}>{sub.icon}</Text> : null}
        <Text style={styles.headerName}>{sub.name}</Text>
        <Text style={[styles.statusBadge, { color: statusColor(sub.status) }]}>
          {statusLabel(sub.status)}
        </Text>
      </View>

      <Card style={styles.priceCard}>
        <Text style={styles.mainPrice}>{formatCurrency(sub.price)}</Text>
        <Text variant="caption" color={colors.textSecondary}>
          per {sub.billing_cycle.replace(/_/g, ' ')}
        </Text>
        <View style={styles.priceNorm}>
          <View style={styles.priceNormItem}>
            <Text variant="caption" color={colors.textSecondary}>Monthly</Text>
            <Text style={styles.normValue}>{formatCurrency(monthly)}</Text>
          </View>
          <View style={styles.priceNormDivider} />
          <View style={styles.priceNormItem}>
            <Text variant="caption" color={colors.textSecondary}>Annual</Text>
            <Text style={styles.normValue}>{formatCurrency(annual)}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.detailsCard}>
        <DetailRow label="Billing Cycle" value={billingLabel(sub.billing_cycle)} />
        <View style={styles.divider} />
        <DetailRow label="Next Renewal" value={sub.status !== 'cancelled' ? formatFullDate(sub.next_renewal) : 'N/A'} />
        <View style={styles.divider} />
        <DetailRow label="Start Date" value={formatFullDate(sub.start_date)} />
        {sub.cancelled_date ? (
          <>
            <View style={styles.divider} />
            <DetailRow label="Cancelled" value={formatFullDate(sub.cancelled_date)} />
          </>
        ) : null}
        {sub.notes ? (
          <>
            <View style={styles.divider} />
            <DetailRow label="Notes" value={sub.notes} />
          </>
        ) : null}
      </Card>

      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.actions}>
        {sub.status === 'active' ? (
          <Button variant="secondary" label="Pause Subscription" onPress={handlePause} disabled={submitting} />
        ) : null}
        {sub.status === 'paused' ? (
          <Button variant="primary" label="Resume Subscription" onPress={handleResume} disabled={submitting} />
        ) : null}
        {sub.status !== 'cancelled' ? (
          <Button variant="ghost" label="Cancel Subscription" onPress={handleCancel} disabled={submitting} />
        ) : null}
        <Button variant="ghost" label="Delete Record" onPress={handleDelete} disabled={submitting} />
      </View>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerIcon: {
    fontSize: 48,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  mainPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: BUDGET_ACCENT,
  },
  priceNorm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceNormItem: {
    alignItems: 'center',
  },
  priceNormDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  normValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  detailsCard: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  errorText: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyActions: {
    marginTop: spacing.sm,
  },
});
