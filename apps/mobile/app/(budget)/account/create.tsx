import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createAccount } from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';
import { uuid } from '../../../lib/uuid';

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

export default function BudgetCreateAccountScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('0.00');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = () => {
    if (submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter an account name.');
      return;
    }

    const parsedBalance = parseBalanceInput(balance);
    if (parsedBalance === null) {
      Alert.alert('Invalid Balance', 'Enter a valid balance amount.');
      return;
    }

    setSubmitting(true);
    try {
      createAccount(db, uuid(), {
        name: trimmedName,
        type,
        current_balance: parsedBalance,
        currency: 'USD',
      });
      router.replace(`/(budget)/accounts?refresh=${Date.now()}` as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account.';
      if (message.toLowerCase().includes('unique')) {
        Alert.alert('Duplicate Name', `An account named "${trimmedName}" already exists.`);
      } else {
        Alert.alert('Error', message);
      }
      setSubmitting(false);
    }
  };

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
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Current Balance (USD)
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

        <View style={styles.actions}>
          <Button
            variant="secondary"
            label="Cancel"
            onPress={() => router.back()}
            style={styles.actionButton}
          />
          <Button
            variant="primary"
            label={submitting ? 'Creating...' : 'Create Account'}
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
});
