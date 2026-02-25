import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  deleteGoal,
  getGoalById,
  listEnvelopes,
  updateGoal,
  type Envelope,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';

function parseAmountInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export default function BudgetGoalScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const goalId = Array.isArray(id) ? id[0] : id;

  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [envelopeId, setEnvelopeId] = useState('');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('0.00');
  const [completedAmount, setCompletedAmount] = useState('0.00');
  const [targetDate, setTargetDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const envelopeName = useMemo(
    () => envelopes.find((entry) => entry.id === envelopeId)?.name ?? 'Unknown envelope',
    [envelopes, envelopeId],
  );

  useEffect(() => {
    if (!goalId) {
      setError('Goal not found.');
      setLoading(false);
      return;
    }

    try {
      const goal = getGoalById(db, goalId);
      if (!goal) {
        setError('Goal not found.');
        setLoading(false);
        return;
      }

      setEnvelopes(listEnvelopes(db, true));
      setEnvelopeId(goal.envelope_id);
      setName(goal.name);
      setTargetAmount((goal.target_amount / 100).toFixed(2));
      setCompletedAmount((goal.completed_amount / 100).toFixed(2));
      setTargetDate(goal.target_date ?? '');
      setIsCompleted(goal.is_completed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal.');
    } finally {
      setLoading(false);
    }
  }, [db, goalId]);

  const goToList = () => {
    router.replace(`/(budget)/goals?refresh=${Date.now()}` as never);
  };

  const handleSave = () => {
    if (!goalId || submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Goal name is required.');
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
      updateGoal(db, goalId, {
        name: trimmedName,
        target_amount: parsedTarget,
        completed_amount: parsedCompleted,
        target_date: targetDate.trim() || null,
        is_completed: isCompleted === 1 || parsedCompleted >= parsedTarget ? 1 : 0,
      });
      goToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal.');
      setSubmitting(false);
    }
  };

  const handleToggleCompleted = () => {
    if (!goalId || submitting) return;

    const parsedTarget = parseAmountInput(targetAmount);
    const parsedCompleted = parseAmountInput(completedAmount);
    if (parsedTarget === null || parsedCompleted === null) {
      setError('Fix amount fields before toggling status.');
      return;
    }

    const next = isCompleted ? 0 : 1;
    const nextCompletedAmount =
      next === 1 ? Math.max(parsedCompleted, parsedTarget) : parsedCompleted;

    setSubmitting(true);
    setError(null);
    try {
      updateGoal(db, goalId, {
        is_completed: next,
        completed_amount: nextCompletedAmount,
      });
      setIsCompleted(next);
      setCompletedAmount((nextCompletedAmount / 100).toFixed(2));
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal status.');
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!goalId || submitting) return;

    Alert.alert('Delete Goal', 'Delete this goal? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setSubmitting(true);
          setError(null);
          try {
            deleteGoal(db, goalId);
            goToList();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete goal.');
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.textSecondary}>
          Loading goal...
        </Text>
      </View>
    );
  }

  if (!goalId || (error && name.length === 0)) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.danger}>
          {error ?? 'Goal not found.'}
        </Text>
        <View style={styles.emptyActions}>
          <Button variant="secondary" label="Back to Goals" onPress={goToList} />
        </View>
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
          <Text variant="body">{envelopeName}</Text>
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

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>
            Status
          </Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setIsCompleted(0)}
              style={[styles.chip, isCompleted === 0 ? styles.chipSelected : null]}
            >
              <Text
                variant="caption"
                color={isCompleted === 0 ? colors.background : colors.textSecondary}
              >
                In Progress
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsCompleted(1)}
              style={[styles.chip, isCompleted === 1 ? styles.chipSelected : null]}
            >
              <Text
                variant="caption"
                color={isCompleted === 1 ? colors.background : colors.textSecondary}
              >
                Complete
              </Text>
            </Pressable>
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
            label={isCompleted ? 'Reopen Goal' : 'Mark Complete'}
            onPress={handleToggleCompleted}
            disabled={submitting}
          />
          <Button
            variant="ghost"
            label="Delete Goal"
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
