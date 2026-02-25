import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { listAccounts, type Account } from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function accountTypeIcon(type: Account['type']): string {
  if (type === 'cash') return '\u{1F4B5}';
  if (type === 'checking') return '\u{1F3E6}';
  if (type === 'savings') return '\u{1FA99}';
  if (type === 'credit') return '\u{1F4B3}';
  return '\u{1F4D2}';
}

function titleCase(word: string): string {
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

export default function BudgetAccountsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(listAccounts(db, includeArchived));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts.');
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

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.archived === 0),
    [accounts],
  );

  const totalBalance = useMemo(
    () =>
      activeAccounts.reduce(
        (sum, account) => sum + account.current_balance,
        0,
      ),
    [activeAccounts],
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text variant="label" color={colors.textTertiary}>
            ACTIVE BALANCE
          </Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBalance)}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {activeAccounts.length} active account
            {activeAccounts.length === 1 ? '' : 's'}
          </Text>
        </Card>
      </View>

      <View style={styles.actionsRow}>
        <Button
          variant="secondary"
          label={includeArchived ? 'Hide Archived' : 'Show Archived'}
          onPress={() => setIncludeArchived((value) => !value)}
          style={styles.actionButton}
        />
        <Button
          variant="primary"
          label="New Account"
          onPress={() => router.push('/(budget)/account/create')}
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
            Loading accounts...
          </Text>
        </View>
      ) : accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            No accounts yet. Create one to start tracking balances.
          </Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
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
              onPress={() => router.push(`/(budget)/account/${item.id}` as never)}
            >
              <Card style={[styles.rowCard, item.archived ? styles.archived : null]}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconPill}>
                    <Text style={styles.iconText}>{accountTypeIcon(item.type)}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text variant="subheading">{item.name}</Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      {titleCase(item.type)} • {item.currency}
                      {item.archived ? ' • Archived' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.balanceValue}>{formatCurrency(item.current_balance)}</Text>
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
  balanceValue: {
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
