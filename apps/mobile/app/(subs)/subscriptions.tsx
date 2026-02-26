import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  getValidTransitions,
  transitionSubscription,
  type Subscription,
  type SubscriptionStatus,
} from '@mylife/subs';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';
import { defaultNextRenewal, formatCents } from './helpers';

type BillingCycle = Subscription['billing_cycle'];

const CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom'];

export default function SubsSubscriptionsScreen() {
  const db = useDatabase();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [category, setCategory] = useState<Subscription['category']>('other');

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const subscriptions = useMemo(() => getSubscriptions(db), [db, tick]);

  const addSubscription = () => {
    const today = new Date().toISOString().slice(0, 10);
    const custom = billingCycle === 'custom' ? Math.max(1, Number(customDays) || 30) : null;
    createSubscription(db, uuid(), {
      name: name.trim() || 'Subscription',
      price: Math.max(0, Math.round((Number(price) || 0) * 100)),
      billing_cycle: billingCycle,
      custom_days: custom,
      category,
      status: 'active',
      start_date: today,
      next_renewal: defaultNextRenewal(today, billingCycle, custom),
      notify_days: 1,
    });

    setName('');
    setPrice('0');
    setBillingCycle('monthly');
    setCustomDays('30');
    refresh();
  };

  const transition = (sub: Subscription, nextStatus: SubscriptionStatus) => {
    transitionSubscription(db, sub.id, nextStatus);
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Add Subscription</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Price"
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.row}>
            {CYCLES.map((cycle) => {
              const selected = billingCycle === cycle;
              return (
                <Pressable
                  key={cycle}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => setBillingCycle(cycle)}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {cycle.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {billingCycle === 'custom' ? (
            <TextInput
              style={styles.input}
              value={customDays}
              onChangeText={setCustomDays}
              placeholder="Custom days"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          ) : null}
          <Pressable style={styles.primaryButton} onPress={addSubscription}>
            <Text variant="label" color={colors.background}>Create</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">All Subscriptions</Text>
        <FlatList
          data={subscriptions}
          keyExtractor={(item: Subscription) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => {
            const transitions = getValidTransitions(item.status);
            return (
              <Card style={styles.innerCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{item.name}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {formatCents(item.price)} · {item.billing_cycle.replace('_', ' ')} · {item.status}
                    </Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      Renews {item.next_renewal}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteSubscription(db, item.id);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
                {transitions.length > 0 ? (
                  <View style={styles.row}>
                    {transitions.map((status) => (
                      <Pressable
                        key={status}
                        style={styles.secondaryButton}
                        onPress={() => transition(item, status)}
                      >
                        <Text variant="caption">{status}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>No subscriptions yet.</Text>
            </View>
          }
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  formGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.modules.subs,
    backgroundColor: colors.modules.subs,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.subs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  list: {
    marginTop: spacing.sm,
  },
  innerCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
