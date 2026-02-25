import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  deleteTransaction,
  getTransaction,
  listAccounts,
  listEnvelopes,
  updateTransaction,
  type Account,
  type Envelope,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';

type TransactionDirection = 'inflow' | 'outflow' | 'transfer';

const DIRECTIONS: TransactionDirection[] = ['outflow', 'inflow', 'transfer'];

function titleCase(word: string): string {
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

function parseAmountInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export default function BudgetTransactionScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const transactionId = Array.isArray(id) ? id[0] : id;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);

  const [amount, setAmount] = useState('0.00');
  const [direction, setDirection] = useState<TransactionDirection>('outflow');
  const [occurredOn, setOccurredOn] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [envelopeId, setEnvelopeId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setError('Transaction not found.');
      setLoading(false);
      return;
    }

    try {
      const tx = getTransaction(db, transactionId);
      if (!tx) {
        setError('Transaction not found.');
        setLoading(false);
        return;
      }

      const accountRows = listAccounts(db, true);
      const envelopeRows = listEnvelopes(db, true);

      setAccounts(accountRows);
      setEnvelopes(envelopeRows);
      setAmount((tx.amount / 100).toFixed(2));
      setDirection(tx.direction);
      setOccurredOn(tx.occurred_on);
      setMerchant(tx.merchant ?? '');
      setNote(tx.note ?? '');
      setAccountId(tx.account_id ?? '');
      setEnvelopeId(tx.envelope_id ?? '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction.');
    } finally {
      setLoading(false);
    }
  }, [db, transactionId]);

  const goToList = () => {
    router.replace(`/(budget)/transactions?refresh=${Date.now()}` as never);
  };

  const handleSave = () => {
    if (!transactionId || submitting) return;

    const parsedAmount = parseAmountInput(amount);
    if (parsedAmount === null) {
      setError('Amount must be a valid non-negative number.');
      return;
    }

    const date = occurredOn.trim();
    if (!date) {
      setError('Date is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      updateTransaction(db, transactionId, {
        amount: parsedAmount,
        direction,
        occurred_on: date,
        merchant: merchant.trim() || null,
        note: note.trim() || null,
        account_id: accountId || null,
        envelope_id: envelopeId || null,
      });
      goToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction.');
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!transactionId || submitting) return;

    Alert.alert(
      'Delete Transaction',
      'Delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSubmitting(true);
            setError(null);
            try {
              deleteTransaction(db, transactionId);
              goToList();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete transaction.');
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.textSecondary}>
          Loading transaction...
        </Text>
      </View>
    );
  }

  if (!transactionId || (error && occurredOn.length === 0)) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.danger}>
          {error ?? 'Transaction not found.'}
        </Text>
        <View style={styles.emptyActions}>
          <Button variant="secondary" label="Back to Transactions" onPress={goToList} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text variant="label" color={colors.textTertiary}>
          TRANSACTION DETAILS
        </Text>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Amount (USD)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Direction
          </Text>
          <View style={styles.typeRow}>
            {DIRECTIONS.map((entry) => {
              const selected = direction === entry;
              return (
                <Pressable
                  key={entry}
                  onPress={() => setDirection(entry)}
                  style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {titleCase(entry)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={occurredOn}
            onChangeText={setOccurredOn}
            placeholder="2026-01-01"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Merchant (optional)
          </Text>
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Coffee Shop"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Account
          </Text>
          <View style={styles.typeRow}>
            <Pressable
              onPress={() => setAccountId('')}
              style={[styles.typeChip, accountId === '' ? styles.typeChipSelected : null]}
            >
              <Text
                variant="caption"
                color={accountId === '' ? colors.background : colors.textSecondary}
              >
                No Account
              </Text>
            </Pressable>
            {accounts.map((account) => {
              const selected = accountId === account.id;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => setAccountId(account.id)}
                  style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {account.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Envelope
          </Text>
          <View style={styles.typeRow}>
            <Pressable
              onPress={() => setEnvelopeId('')}
              style={[styles.typeChip, envelopeId === '' ? styles.typeChipSelected : null]}
            >
              <Text
                variant="caption"
                color={envelopeId === '' ? colors.background : colors.textSecondary}
              >
                No Envelope
              </Text>
            </Pressable>
            {envelopes.map((envelope) => {
              const selected = envelopeId === envelope.id;
              return (
                <Pressable
                  key={envelope.id}
                  onPress={() => setEnvelopeId(envelope.id)}
                  style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {envelope.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Note (optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional details"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.noteInput]}
          />
        </View>

        {error ? (
          <Text variant="caption" color={colors.danger}>
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            variant="secondary"
            label="Cancel"
            onPress={goToList}
            style={styles.actionButton}
          />
          <Button
            variant="primary"
            label={submitting ? 'Saving...' : 'Save'}
            onPress={handleSave}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.secondaryActions}>
          <Button
            variant="ghost"
            label="Delete Transaction"
            onPress={handleDelete}
            disabled={submitting}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  typeChipSelected: {
    backgroundColor: colors.modules.budget,
    borderColor: colors.modules.budget,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  secondaryActions: {
    gap: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyActions: {
    marginTop: spacing.sm,
  },
});
