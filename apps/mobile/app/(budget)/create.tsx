import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createEnvelope } from '@mylife/budget';
import { Button, Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

export default function BudgetCreateEnvelopeScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('0.00');
  const [icon, setIcon] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = () => {
    if (submitting) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter an envelope name.');
      return;
    }

    const parsedBudget = Number(monthlyBudget);
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
      Alert.alert('Invalid Budget', 'Enter a valid non-negative budget amount.');
      return;
    }

    setSubmitting(true);
    try {
      createEnvelope(db, uuid(), {
        name: trimmedName,
        icon: icon.trim() || null,
        monthly_budget: Math.round(parsedBudget * 100),
      });
      router.replace(`/(budget)?refresh=${Date.now()}` as never);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create envelope.';
      if (message.toLowerCase().includes('unique')) {
        Alert.alert('Duplicate Name', `An envelope named "${trimmedName}" already exists.`);
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
          ENVELOPE DETAILS
        </Text>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Groceries"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Monthly Budget (USD)
          </Text>
          <TextInput
            value={monthlyBudget}
            onChangeText={setMonthlyBudget}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Icon (optional)
          </Text>
          <TextInput
            value={icon}
            onChangeText={setIcon}
            placeholder="🛒"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
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
            label={submitting ? 'Creating...' : 'Create Envelope'}
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
