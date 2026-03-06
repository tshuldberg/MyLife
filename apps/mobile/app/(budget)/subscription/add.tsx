import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  createSubscription,
  searchCatalog,
  getPopularEntries,
  calculateNextRenewal,
  type CatalogEntry,
} from '@mylife/budget';
import { Button, Card, Text, borderRadius, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';
import { uuid } from '../../../lib/uuid';

type BillingCycleOption = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'weekly';

const BILLING_CYCLES: { value: BillingCycleOption; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'weekly', label: 'Weekly' },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type Step = 'search' | 'form';

export default function BudgetAddSubscriptionScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycleOption>('monthly');
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [catalogId, setCatalogId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (searchQuery.length === 0) return getPopularEntries();
    return searchCatalog(searchQuery);
  }, [searchQuery]);

  const handleSelectCatalogEntry = useCallback((entry: CatalogEntry) => {
    setName(entry.name);
    setPrice((entry.defaultPrice / 100).toFixed(2));
    setBillingCycle(entry.billingCycle === 'custom' ? 'monthly' : entry.billingCycle as BillingCycleOption);
    setCatalogId(entry.id);
    setStep('form');
  }, []);

  const handleCustomEntry = useCallback(() => {
    setName('');
    setPrice('');
    setCatalogId(null);
    setStep('form');
  }, []);

  const canSave = name.trim().length > 0 && price.length > 0;

  const handleSave = useCallback(() => {
    if (submitting || !canSave) return;

    const cents = Math.round(parseFloat(price) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError('Enter a valid price.');
      return;
    }

    const nextRenewal = calculateNextRenewal(startDate, billingCycle);

    setSubmitting(true);
    setError(null);
    try {
      createSubscription(db, uuid(), {
        name: name.trim(),
        price: cents,
        billing_cycle: billingCycle,
        status: 'active',
        start_date: startDate,
        next_renewal: nextRenewal,
        notes: notes.trim() || null,
        catalog_id: catalogId,
      });
      router.replace(`/(budget)/subscriptions?refresh=${Date.now()}` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription.');
      setSubmitting(false);
    }
  }, [submitting, canSave, price, startDate, billingCycle, db, name, notes, catalogId, router]);

  if (step === 'search') {
    return (
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search subscriptions..."
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoFocus
          />
        </View>

        <Pressable onPress={handleCustomEntry} style={styles.customRow}>
          <Text variant="body" style={styles.customText}>+ Add custom subscription</Text>
        </Pressable>

        <View style={styles.sectionLabel}>
          <Text variant="label" color={colors.textTertiary}>
            {searchQuery ? 'RESULTS' : 'POPULAR'}
          </Text>
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelectCatalogEntry(item)}
              style={styles.catalogRow}
            >
              <View style={styles.catalogLeft}>
                <Text variant="body">{item.name}</Text>
                <Text variant="caption" color={colors.textTertiary}>{item.category}</Text>
              </View>
              <View style={styles.catalogRight}>
                <Text style={styles.catalogPrice}>
                  ${(item.defaultPrice / 100).toFixed(2)}
                </Text>
                <Text variant="caption" color={colors.textTertiary}>
                  /{item.billingCycle === 'annual' ? 'yr' : 'mo'}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text variant="caption" color={colors.textSecondary} style={styles.emptyText}>
              No matches found
            </Text>
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Text variant="label" color={colors.textTertiary}>
          SUBSCRIPTION DETAILS
        </Text>

        {catalogId ? (
          <View style={styles.catalogBadge}>
            <Text variant="caption" color={BUDGET_ACCENT}>From catalog</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Netflix"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>Price (USD)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>Billing Cycle</Text>
          <View style={styles.chipRow}>
            {BILLING_CYCLES.map((cycle) => {
              const selected = billingCycle === cycle.value;
              return (
                <Pressable
                  key={cycle.value}
                  onPress={() => setBillingCycle(cycle.value)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {cycle.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>Start Date (YYYY-MM-DD)</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-01-01"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text variant="caption" color={colors.textSecondary}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional details"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.noteInput]}
          />
        </View>

        {error ? (
          <Text variant="caption" color={colors.danger}>{error}</Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setStep('search')}
            style={styles.actionButton}
          />
          <Button
            variant="primary"
            label={submitting ? 'Saving...' : 'Save Subscription'}
            onPress={handleSave}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const BUDGET_ACCENT = colors.modules.budget;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBox: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  customRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  customText: {
    color: colors.modules.budget,
    fontWeight: '600',
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  catalogLeft: {
    flex: 1,
  },
  catalogRight: {
    alignItems: 'flex-end',
  },
  catalogPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  formContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    gap: spacing.md,
  },
  catalogBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: colors.modules.budget,
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
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
