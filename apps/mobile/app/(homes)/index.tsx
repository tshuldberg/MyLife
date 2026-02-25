import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createListing,
  deleteListing,
  getHomeMarketMetrics,
  getListings,
  toggleListingSaved,
  type HomeListing,
} from '@mylife/homes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

export default function HomesScreen() {
  const db = useDatabase();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('CA');
  const [price, setPrice] = useState('850000');

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const overview = useMemo(() => getHomeMarketMetrics(db), [db, tick]);
  const listings = useMemo(() => getListings(db), [db, tick]);

  const addListing = () => {
    createListing(db, uuid(), {
      address: address.trim() || 'New Listing',
      city: city.trim() || 'Unknown',
      state: stateCode.trim().toUpperCase() || 'CA',
      priceCents: Math.max(0, Number(price) || 0) * 100,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1400,
      status: 'new',
    });
    setAddress('');
    setCity('');
    setStateCode('CA');
    setPrice('850000');
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Listings" value={String(overview.listings)} />
        <Metric label="Saved" value={String(overview.savedListings)} />
        <Metric label="Avg Price" value={`$${Math.round(overview.averagePriceCents / 100).toLocaleString()}`} />
        <Metric label="Avg $/sqft" value={`$${Math.round(overview.averagePricePerSqft || 0)}`} />
      </View>

      <Card>
        <Text variant="subheading">Add Listing</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={stateCode}
            onChangeText={setStateCode}
            placeholder="State"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Price"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
          <Pressable style={styles.primaryButton} onPress={addListing}>
            <Text variant="label" color={colors.background}>Add</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Listing Feed</Text>
        <FlatList
          data={listings}
          keyExtractor={(item: HomeListing) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.innerCard}>
              <View style={styles.rowBetween}>
                <View style={styles.mainCopy}>
                  <Text variant="body">{item.address}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.city}, {item.state} · ${Math.round(item.priceCents / 100).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      toggleListingSaved(db, item.id);
                      refresh();
                    }}
                  >
                    <Text variant="label">{item.isSaved ? 'Saved' : 'Save'}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteListing(db, item.id);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>No listings yet.</Text>
            </View>
          }
        />
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.modules.homes,
    fontSize: 20,
    fontWeight: '700',
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
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.homes,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 80,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
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
