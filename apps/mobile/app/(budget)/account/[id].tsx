import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteAccount, getAccount, updateAccount } from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';

type AccountType = 'cash' | 'checking' | 'savings' | 'credit' | 'other';

const ACCOUNT_TYPES: AccountType[] = [
  'cash',
  'checking',
  'savings',
  'credit',
  'other',
];

function titleCase(word: string): string {
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

function parseBalanceInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export default function BudgetAccountScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const accountId = Array.isArray(id) ? id[0] : id;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('0.00');
  const [currency, setCurrency] = useState('USD');
  const [archived, setArchived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setError('Account not found.');
      setLoading(false);
      return;
    }

    try {
      const account = getAccount(db, accountId);
      if (!account) {
        setError('Account not found.');
        setLoading(false);
        return;
      }

      setName(account.name);
      setType(account.type);
      setBalance((account.current_balance / 100).toFixed(2));
      setCurrency(account.currency);
      setArchived(account.archived);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account.');
    } finally {
      setLoading(false);
    }
  }, [accountId, db]);

  const goToList = () => {
    router.replace(`/(budget)/accounts?refresh=${Date.now()}` as never);
  };

  const handleSave = () => {
    if (!accountId || submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Account name is required.');
      return;
    }

    const parsedBalance = parseBalanceInput(balance);
    if (parsedBalance === null) {
      setError('Current balance must be a valid number.');
      return;
    }

    const trimmedCurrency = currency.trim().toUpperCase();
    if (trimmedCurrency.length !== 3) {
      setError('Currency must be a 3-letter code (for example: USD).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      updateAccount(db, accountId, {
        name: trimmedName,
        type,
        current_balance: parsedBalance,
        currency: trimmedCurrency,
      });
      goToList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save account.';
      if (message.toLowerCase().includes('unique')) {
        setError(`An account named "${trimmedName}" already exists.`);
      } else {
        setError(message);
      }
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = () => {
    if (!accountId || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const nextArchived = archived ? 0 : 1;
      updateAccount(db, accountId, { archived: nextArchived });
      setArchived(nextArchived);
      goToList();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update archive state.',
      );
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!accountId || submitting) return;

    Alert.alert(
      'Delete Account',
      'Delete this account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSubmitting(true);
            setError(null);
            try {
              deleteAccount(db, accountId);
              goToList();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete account.');
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
          Loading account...
        </Text>
      </View>
    );
  }

  if (!accountId || (error && name.length === 0)) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.danger}>
          {error ?? 'Account not found.'}
        </Text>
        <View style={styles.emptyActions}>
          <Button variant="secondary" label="Back to Accounts" onPress={goToList} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text variant="label" color={colors.textTertiary}>
          ACCOUNT DETAILS
        </Text>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Checking"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Current Balance
          </Text>
          <TextInput
            value={balance}
            onChangeText={setBalance}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Currency
          </Text>
          <TextInput
            value={currency}
            onChangeText={setCurrency}
            placeholder="USD"
            placeholderTextColor={colors.textTertiary}
            maxLength={3}
            autoCapitalize="characters"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Account Type
          </Text>
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map((accountType) => {
              const selected = type === accountType;
              return (
                <Pressable
                  key={accountType}
                  onPress={() => setType(accountType)}
                  style={[styles.typeChip, selected ? styles.typeChipSelected : null]}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {titleCase(accountType)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
            label={archived ? 'Restore Account' : 'Archive Account'}
            onPress={handleArchiveToggle}
            disabled={submitting}
          />
          <Button
            variant="ghost"
            label="Delete Account"
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
