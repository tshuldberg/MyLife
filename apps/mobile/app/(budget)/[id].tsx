import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteEnvelope, getEnvelope, updateEnvelope } from '@mylife/budget';
import { Button, Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function parseBudgetInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export default function BudgetEnvelopeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const envelopeId = Array.isArray(id) ? id[0] : id;

  const [name, setName] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('0.00');
  const [icon, setIcon] = useState('');
  const [archived, setArchived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!envelopeId) {
      setError('Envelope not found.');
      setLoading(false);
      return;
    }

    try {
      const envelope = getEnvelope(db, envelopeId);
      if (!envelope) {
        setError('Envelope not found.');
        setLoading(false);
        return;
      }

      setName(envelope.name);
      setMonthlyBudget((envelope.monthly_budget / 100).toFixed(2));
      setIcon(envelope.icon ?? '');
      setArchived(envelope.archived);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load envelope.');
    } finally {
      setLoading(false);
    }
  }, [db, envelopeId]);

  const goToList = () => {
    router.replace(`/(budget)?refresh=${Date.now()}` as never);
  };

  const handleSave = () => {
    if (!envelopeId || submitting) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Envelope name is required.');
      return;
    }

    const parsedBudget = parseBudgetInput(monthlyBudget);
    if (parsedBudget === null) {
      setError('Monthly budget must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      updateEnvelope(db, envelopeId, {
        name: trimmedName,
        icon: icon.trim() || null,
        monthly_budget: parsedBudget,
      });
      goToList();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save envelope.';
      if (message.toLowerCase().includes('unique')) {
        setError(`An envelope named "${trimmedName}" already exists.`);
      } else {
        setError(message);
      }
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = () => {
    if (!envelopeId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const nextArchived = archived ? 0 : 1;
      updateEnvelope(db, envelopeId, { archived: nextArchived });
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
    if (!envelopeId || submitting) return;
    Alert.alert(
      'Delete Envelope',
      'Delete this envelope? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSubmitting(true);
            setError(null);
            try {
              deleteEnvelope(db, envelopeId);
              goToList();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Failed to delete envelope.',
              );
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
          Loading envelope...
        </Text>
      </View>
    );
  }

  if (!envelopeId || (error && name.length === 0)) {
    return (
      <View style={styles.emptyState}>
        <Text variant="body" color={colors.danger}>
          {error ?? 'Envelope not found.'}
        </Text>
        <View style={styles.emptyActions}>
          <Button variant="secondary" label="Back to Budget" onPress={goToList} />
        </View>
      </View>
    );
  }

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
            placeholder="\u{1F4BC}"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
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
            label={archived ? 'Restore Envelope' : 'Archive Envelope'}
            onPress={handleArchiveToggle}
            disabled={submitting}
          />
          <Button
            variant="ghost"
            label="Delete Envelope"
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
