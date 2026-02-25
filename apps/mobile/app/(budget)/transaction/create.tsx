import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  createTransaction,
  listAccounts,
  listEnvelopes,
  type Account,
  type Envelope,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';
import { uuid } from '../../../lib/uuid';

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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BudgetCreateTransactionScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);

  const [amount, setAmount] = useState('0.00');
  const [direction, setDirection] = useState<TransactionDirection>('outflow');
  const [occurredOn, setOccurredOn] = useState(todayIsoDate());
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [envelopeId, setEnvelopeId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const accountRows = listAccounts(db, false);
      const envelopeRows = listEnvelopes(db, false);
      setAccounts(accountRows);
      setEnvelopes(envelopeRows);
      if (accountRows.length > 0) setAccountId(accountRows[0].id);
      if (envelopeRows.length > 0) setEnvelopeId(envelopeRows[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction form data.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  const handleCreate = () => {
    if (submitting) return;

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
      createTransaction(db, uuid(), {
        amount: parsedAmount,
        direction,
        occurred_on: date,
        merchant: merchant.trim() || null,
        note: note.trim() || null,
        account_id: accountId || null,
        envelope_id: envelopeId || null,
      });
      router.replace(`/(budget)/transactions?refresh=${Date.now()}` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.textSecondary}>
          Loading transaction form...
        </Text>
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
            onPress={() => router.back()}
            style={styles.actionButton}
          />
          <Button
            variant="primary"
            label={submitting ? 'Creating...' : 'Create Transaction'}
            onPress={handleCreate}
            style={styles.actionButton}
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
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
});
