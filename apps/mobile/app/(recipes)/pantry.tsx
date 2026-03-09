import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  classifyExpiration,
  createPantryItem,
  deletePantryItem,
  getPantryItems,
  type PantryItem,
  type StorageLocation,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;
const STORAGE_LOCATIONS: StorageLocation[] = ['pantry', 'fridge', 'freezer', 'counter', 'other'];

function expiryLabel(item: PantryItem): { label: string; tone: string } {
  const status = classifyExpiration(item.expiration_date);
  switch (status) {
    case 'expired':
      return { label: 'Expired', tone: colors.danger };
    case 'expiring_soon':
      return { label: 'Expiring soon', tone: '#F5A623' };
    case 'fresh':
      return { label: 'Fresh', tone: colors.success };
    case 'no_date':
      return { label: 'No date', tone: colors.textTertiary };
  }
}

export default function PantryScreen() {
  const db = useDatabase();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [storage, setStorage] = useState<StorageLocation>('pantry');
  const [expirationDate, setExpirationDate] = useState('');

  const load = useCallback(() => {
    setItems(getPantryItems(db, { sortBy: 'expiration_date', sortDir: 'ASC' }));
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const expiringSoon = items.filter((item) => classifyExpiration(item.expiration_date) === 'expiring_soon').length;
    const expired = items.filter((item) => classifyExpiration(item.expiration_date) === 'expired').length;
    return { total: items.length, expiringSoon, expired };
  }, [items]);

  const handleAdd = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Missing Item', 'Enter a pantry item name.');
      return;
    }

    createPantryItem(db, {
      name: cleanName,
      quantity: quantity.trim() ? Number.parseFloat(quantity) || null : null,
      unit: unit.trim() || null,
      storage_location: storage,
      expiration_date: expirationDate.trim() || null,
      is_staple: storage === 'pantry' && !expirationDate.trim() ? 1 : 0,
    });
    setName('');
    setQuantity('');
    setUnit('');
    setExpirationDate('');
    setStorage('pantry');
    setShowForm(false);
    load();
  };

  const handleDelete = (item: PantryItem) => {
    Alert.alert('Delete Pantry Item', `Remove ${item.name} from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePantryItem(db, item.id);
          load();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Items</Text>
          <Text style={styles.metricValue}>{stats.total}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Expiring</Text>
          <Text style={[styles.metricValue, { color: '#F5A623' }]}>{stats.expiringSoon}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Expired</Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>{stats.expired}</Text>
        </Card>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Pantry Tracker</Text>
          <Pressable onPress={() => setShowForm((value) => !value)}>
            <Text variant="label" color={ACCENT}>{showForm ? 'Cancel' : '+ Add Item'}</Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Item name"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.inlineFields}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Qty"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={unit}
                onChangeText={setUnit}
                placeholder="Unit"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <TextInput
              style={styles.input}
              value={expirationDate}
              onChangeText={setExpirationDate}
              placeholder="Expiration date (YYYY-MM-DD)"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.chipRow}>
              {STORAGE_LOCATIONS.map((value) => {
                const active = storage === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setStorage(value)}
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text variant="caption" color={active ? colors.background : colors.textSecondary}>
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.addButton} onPress={handleAdd}>
              <Text variant="label" color={colors.background}>Save Item</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text variant="subheading">Inventory</Text>
        {items.length === 0 ? (
          <Text variant="caption" color={colors.textSecondary}>
            No pantry items yet. Add staples and perishables here to improve recipe matching and shopping lists.
          </Text>
        ) : (
          items.map((item) => {
            const badge = expiryLabel(item);
            return (
              <Pressable key={item.id} style={styles.itemRow} onLongPress={() => handleDelete(item)}>
                <View style={styles.flex1}>
                  <Text variant="body">{item.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.quantity !== null ? `${item.quantity} ` : ''}
                    {item.unit ?? ''}{item.unit ? ' ' : ''}
                    {item.storage_location}
                    {item.expiration_date ? ` · ${item.expiration_date}` : ''}
                  </Text>
                </View>
                <Text variant="caption" color={badge.tone}>{badge.label}</Text>
              </Pressable>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
  },
  metricValue: {
    color: ACCENT,
    fontSize: 24,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  form: {
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
  inlineFields: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
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
  chipActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
