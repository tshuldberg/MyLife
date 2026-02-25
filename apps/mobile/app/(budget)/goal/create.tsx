import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  createGoal,
  listEnvelopes,
  type Envelope,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';
import { uuid } from '../../../lib/uuid';

function parseAmountInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export default function BudgetCreateGoalScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('0.00');
  const [completedAmount, setCompletedAmount] = useState('0.00');
  const [targetDate, setTargetDate] = useState('');
  const [envelopeId, setEnvelopeId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const envelopeRows = listEnvelopes(db, false);
      setEnvelopes(envelopeRows);
      if (envelopeRows.length > 0) {
        setEnvelopeId(envelopeRows[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal form data.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  const handleCreate = () => {
    if (submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Goal name is required.');
      return;
    }

    if (!envelopeId) {
      setError('Select an envelope before creating a goal.');
      return;
    }

    const parsedTarget = parseAmountInput(targetAmount);
    if (parsedTarget === null || parsedTarget <= 0) {
      setError('Target amount must be a valid number greater than zero.');
      return;
    }

    const parsedCompleted = parseAmountInput(completedAmount);
    if (parsedCompleted === null) {
      setError('Completed amount must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      createGoal(db, uuid(), {
        envelope_id: envelopeId,
        name: trimmedName,
        target_amount: parsedTarget,
        completed_amount: parsedCompleted,
        target_date: targetDate.trim() || null,
        is_completed: parsedCompleted >= parsedTarget ? 1 : 0,
      });
      router.replace(`/(budget)/goals?refresh=${Date.now()}` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.textSecondary}>
          Loading goal form...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text variant="label" color={colors.textTertiary}>
          GOAL DETAILS
        </Text>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Emergency Fund"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Envelope
          </Text>
          <View style={styles.chipRow}>
            {envelopes.map((envelope) => {
              const selected = envelope.id === envelopeId;
              return (
                <Pressable
                  key={envelope.id}
                  onPress={() => setEnvelopeId(envelope.id)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
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
            Target Amount (USD)
          </Text>
          <TextInput
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Completed Amount (USD)
          </Text>
          <TextInput
            value={completedAmount}
            onChangeText={setCompletedAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Target Date (optional, YYYY-MM-DD)
          </Text>
          <TextInput
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="2026-12-31"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {envelopes.length === 0 ? (
          <Text variant="caption" color={colors.danger}>
            Create at least one envelope before adding a goal.
          </Text>
        ) : null}

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
            label={submitting ? 'Creating...' : 'Create Goal'}
            onPress={handleCreate}
            disabled={envelopes.length === 0}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipSelected: {
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
