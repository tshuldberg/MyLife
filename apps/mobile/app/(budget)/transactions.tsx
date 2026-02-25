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
  listAccounts,
  listEnvelopes,
  listTransactions,
  type Account,
  type BudgetTransaction,
  type Envelope,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

type TransactionDirection = 'inflow' | 'outflow' | 'transfer';

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTransactionAmount(
  amount: number,
  direction: TransactionDirection,
): string {
  const base = formatCurrency(Math.abs(amount));
  if (direction === 'outflow') return `-${base}`;
  if (direction === 'inflow') return `+${base}`;
  return base;
}

function titleCase(word: string): string {
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

function directionIcon(direction: TransactionDirection): string {
  if (direction === 'outflow') return '\u{2198}';
  if (direction === 'inflow') return '\u{2197}';
  return '\u{2194}';
}

export default function BudgetTransactionsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      setTransactions(listTransactions(db, { limit: 200 }));
      setAccounts(listAccounts(db, true));
      setEnvelopes(listEnvelopes(db, true));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions.');
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

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );

  const envelopeNameById = useMemo(
    () => new Map(envelopes.map((envelope) => [envelope.id, envelope.name])),
    [envelopes],
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text variant="label" color={colors.textTertiary}>
            TRANSACTIONS
          </Text>
          <Text style={styles.totalValue}>{transactions.length.toLocaleString()}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Showing the most recent 200
          </Text>
        </Card>
      </View>

      <View style={styles.actionsRow}>
        <Button
          variant="primary"
          label="New Transaction"
          onPress={() => router.push('/(budget)/transaction/create')}
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
            Loading transactions...
          </Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            No transactions yet. Add one to start tracking movement.
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
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
          renderItem={({ item }) => {
            const amountColor =
              item.direction === 'outflow'
                ? colors.danger
                : item.direction === 'inflow'
                  ? colors.success
                  : colors.text;
            const accountName = item.account_id
              ? accountNameById.get(item.account_id) ?? 'Unknown account'
              : 'No account';
            const envelopeName = item.envelope_id
              ? envelopeNameById.get(item.envelope_id) ?? 'Unknown envelope'
              : 'No envelope';

            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/(budget)/transaction/${item.id}` as never)}
              >
                <Card style={styles.rowCard}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconPill}>
                      <Text style={styles.iconText}>{directionIcon(item.direction)}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text variant="subheading">
                        {item.merchant?.trim() ? item.merchant : 'Transaction'}
                      </Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        {item.occurred_on} • {titleCase(item.direction)}
                      </Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        {accountName} • {envelopeName}
                      </Text>
                      {item.note ? (
                        <Text variant="caption" color={colors.textTertiary}>
                          {item.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={[styles.amountValue, { color: amountColor }]}>
                    {formatTransactionAmount(item.amount, item.direction)}
                  </Text>
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
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
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
