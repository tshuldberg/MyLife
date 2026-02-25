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
  getGoals,
  listEnvelopes,
  type BudgetGoal,
  type Envelope,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function goalProgressPercent(goal: BudgetGoal): number {
  if (goal.target_amount <= 0) {
    return goal.completed_amount > 0 ? 100 : 0;
  }
  return Math.max(
    0,
    Math.min(100, Math.round((goal.completed_amount / goal.target_amount) * 100)),
  );
}

export default function BudgetGoalsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'in_progress' | 'completed'
  >('all');
  const [envelopeFilterId, setEnvelopeFilterId] = useState('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'progress_desc' | 'target_desc' | 'due_soon'
  >('newest');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      setGoals(getGoals(db));
      setEnvelopes(listEnvelopes(db, true));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals.');
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

  const envelopeNameById = useMemo(
    () => new Map(envelopes.map((envelope) => [envelope.id, envelope.name])),
    [envelopes],
  );

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.target_amount, 0),
    [goals],
  );

  const totalCompleted = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.completed_amount, 0),
    [goals],
  );

  const completedCount = useMemo(
    () => goals.filter((goal) => goal.is_completed === 1).length,
    [goals],
  );

  const filteredGoals = useMemo(() => {
    const next = goals.filter((goal) => {
      if (statusFilter === 'completed' && goal.is_completed !== 1) {
        return false;
      }
      if (statusFilter === 'in_progress' && goal.is_completed !== 0) {
        return false;
      }
      if (envelopeFilterId !== 'all' && goal.envelope_id !== envelopeFilterId) {
        return false;
      }
      return true;
    });

    next.sort((a, b) => {
      const progressA =
        a.target_amount > 0 ? a.completed_amount / a.target_amount : 0;
      const progressB =
        b.target_amount > 0 ? b.completed_amount / b.target_amount : 0;

      if (sortBy === 'newest') {
        return b.created_at.localeCompare(a.created_at);
      }
      if (sortBy === 'oldest') {
        return a.created_at.localeCompare(b.created_at);
      }
      if (sortBy === 'progress_desc') {
        return progressB - progressA;
      }
      if (sortBy === 'target_desc') {
        return b.target_amount - a.target_amount;
      }

      const dueA = a.target_date ? Date.parse(a.target_date) : Number.MAX_SAFE_INTEGER;
      const dueB = b.target_date ? Date.parse(b.target_date) : Number.MAX_SAFE_INTEGER;
      return dueA - dueB;
    });

    return next;
  }, [envelopeFilterId, goals, sortBy, statusFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text variant="label" color={colors.textTertiary}>
            GOALS PROGRESS
          </Text>
          <Text style={styles.totalValue}>{formatCurrency(totalCompleted)}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {completedCount}/{goals.length} completed • target {formatCurrency(totalTarget)}
          </Text>
        </Card>
      </View>

      <View style={styles.actionsRow}>
        <Button
          variant="primary"
          label="New Goal"
          onPress={() => router.push('/(budget)/goal/create')}
          style={styles.actionButton}
        />
      </View>
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setStatusFilter('all')}
            style={[
              styles.filterChip,
              statusFilter === 'all' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={statusFilter === 'all' ? colors.background : colors.textSecondary}
            >
              All Statuses
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('in_progress')}
            style={[
              styles.filterChip,
              statusFilter === 'in_progress' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={
                statusFilter === 'in_progress'
                  ? colors.background
                  : colors.textSecondary
              }
            >
              In Progress
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('completed')}
            style={[
              styles.filterChip,
              statusFilter === 'completed' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={
                statusFilter === 'completed' ? colors.background : colors.textSecondary
              }
            >
              Completed
            </Text>
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setEnvelopeFilterId('all')}
            style={[
              styles.filterChip,
              envelopeFilterId === 'all' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={envelopeFilterId === 'all' ? colors.background : colors.textSecondary}
            >
              All Envelopes
            </Text>
          </Pressable>
          {envelopes.map((envelope) => {
            const selected = envelopeFilterId === envelope.id;
            return (
              <Pressable
                key={envelope.id}
                onPress={() => setEnvelopeFilterId(envelope.id)}
                style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
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
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setSortBy('newest')}
            style={[
              styles.filterChip,
              sortBy === 'newest' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={sortBy === 'newest' ? colors.background : colors.textSecondary}
            >
              Sort: Newest
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('oldest')}
            style={[
              styles.filterChip,
              sortBy === 'oldest' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={sortBy === 'oldest' ? colors.background : colors.textSecondary}
            >
              Sort: Oldest
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('progress_desc')}
            style={[
              styles.filterChip,
              sortBy === 'progress_desc' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={sortBy === 'progress_desc' ? colors.background : colors.textSecondary}
            >
              Sort: Progress
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('target_desc')}
            style={[
              styles.filterChip,
              sortBy === 'target_desc' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={sortBy === 'target_desc' ? colors.background : colors.textSecondary}
            >
              Sort: Target
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('due_soon')}
            style={[
              styles.filterChip,
              sortBy === 'due_soon' ? styles.filterChipSelected : null,
            ]}
          >
            <Text
              variant="caption"
              color={sortBy === 'due_soon' ? colors.background : colors.textSecondary}
            >
              Sort: Due Soon
            </Text>
          </Pressable>
        </View>
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
            Loading goals...
          </Text>
        </View>
      ) : goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            No goals yet. Add one to track progress.
          </Text>
        </View>
      ) : filteredGoals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            No goals match the current filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
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
            const percent = goalProgressPercent(item);
            const envelopeName = envelopeNameById.get(item.envelope_id) ?? 'Unknown envelope';

            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/(budget)/goal/${item.id}` as never)}
              >
                <Card style={styles.rowCard}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconPill}>
                      <Text style={styles.iconText}>{item.is_completed ? '✅' : '🎯'}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text variant="subheading">{item.name}</Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        {envelopeName}
                        {item.target_date ? ` • Due ${item.target_date}` : ' • No due date'}
                      </Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        {formatCurrency(item.completed_amount)} of{' '}
                        {formatCurrency(item.target_amount)} ({percent}%)
                      </Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.statusValue,
                      { color: item.is_completed ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {item.is_completed ? 'Complete' : 'In Progress'}
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
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.modules.budget,
    borderColor: colors.modules.budget,
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
  progressTrack: {
    marginTop: 4,
    width: '100%',
    maxWidth: 200,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BUDGET_ACCENT,
  },
  statusValue: {
    fontSize: 12,
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
