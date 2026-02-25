import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { listEnvelopes, type Envelope } from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function BudgetHomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      setEnvelopes(listEnvelopes(db, includeArchived));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load envelopes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, includeArchived]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const totalBudget = useMemo(() => {
    return envelopes
      .filter((e) => e.archived === 0)
      .reduce((sum, e) => sum + e.monthly_budget, 0);
  }, [envelopes]);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text variant="label" color={colors.textTertiary}>
            TOTAL MONTHLY
          </Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBudget)}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {envelopes.filter((e) => e.archived === 0).length} active envelopes
          </Text>
        </Card>
      </View>

      <View style={styles.actionsRow}>
        <Button
          variant="secondary"
          label={includeArchived ? 'Hide Archived' : 'Show Archived'}
          onPress={() => setIncludeArchived((v) => !v)}
          style={styles.actionButton}
        />
        <Button
          variant="primary"
          label="New Envelope"
          onPress={() => router.push('/(budget)/create')}
          style={styles.actionButton}
        />
      </View>
      <View style={styles.actionsRow}>
        <Button
          variant="secondary"
          label="Accounts"
          onPress={() => router.push('/(budget)/accounts')}
          style={styles.actionButton}
        />
        <Button
          variant="secondary"
          label="Transactions"
          onPress={() => router.push('/(budget)/transactions')}
          style={styles.actionButton}
        />
      </View>
      <View style={styles.actionsRow}>
        <Button
          variant="secondary"
          label="Goals"
          onPress={() => router.push('/(budget)/goals')}
          style={styles.actionButton}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text variant="caption" color={colors.danger}>
            {error}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>
            Loading envelopes...
          </Text>
        </View>
      ) : envelopes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            No envelopes yet. Create one to start budgeting.
          </Text>
        </View>
      ) : (
        <FlatList
          data={envelopes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BUDGET_ACCENT}
              colors={[BUDGET_ACCENT]}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/(budget)/${item.id}` as never)}
            >
              <Card style={[styles.rowCard, item.archived ? styles.archived : null]}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconPill}>
                    <Text style={styles.iconText}>{item.icon ?? '\u{1F4BC}'}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text variant="subheading">{item.name}</Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      {item.rollover_enabled ? 'Rollover' : 'No rollover'}
                      {item.archived ? ' • Archived' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.budgetValue}>{formatCurrency(item.monthly_budget)}</Text>
              </Card>
            </Pressable>
          )}
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
    gap: spacing.xs,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: BUDGET_ACCENT,
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BUDGET_ACCENT,
    marginLeft: spacing.sm,
  },
  archived: {
    opacity: 0.7,
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
