import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createClothingItem,
  getClosetDashboard,
  listClothingItems,
  listDirtyClothingItems,
} from '@mylife/closet';
import type { CareInstruction, ClothingCategory, LaundryStatus } from '@mylife/closet';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const CLOSET_ACCENT = '#E879A8';
const CATEGORIES: ClothingCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'activewear',
  'underwear',
  'other',
];
const CARE_OPTIONS: CareInstruction[] = ['machine_wash', 'hand_wash', 'dry_clean', 'delicate'];
const LAUNDRY_FILTERS: Array<'all' | LaundryStatus> = ['all', 'clean', 'dirty'];

function splitTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

export default function ClosetWardrobeScreen() {
  const db = useDatabase();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [careInstructions, setCareInstructions] = useState<CareInstruction>('machine_wash');
  const [autoDirtyOnWear, setAutoDirtyOnWear] = useState(true);
  const [laundryFilter, setLaundryFilter] = useState<'all' | LaundryStatus>('all');
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((value) => value + 1);
  const items = useMemo(
    () =>
      listClothingItems(db, {
        status: 'active',
        limit: 200,
        search: search.trim() || undefined,
        laundryStatus: laundryFilter === 'all' ? undefined : laundryFilter,
      }),
    [db, tick, search, laundryFilter],
  );
  const dirtyItems = useMemo(() => listDirtyClothingItems(db), [db, tick]);
  const dashboard = useMemo(() => getClosetDashboard(db), [db, tick]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Wardrobe Snapshot</Text>
        <View style={styles.statsGrid}>
          <Stat label="Items" value={String(dashboard.totalItems)} />
          <Stat label="Dirty" value={String(dirtyItems.length)} />
          <Stat label="Value" value={`$${(dashboard.wardrobeValueCents / 100).toFixed(0)}`} />
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Catalog Filters</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, brand, or color"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.chipRow}>
            {LAUNDRY_FILTERS.map((option) => {
              const selected = option === laundryFilter;
              return (
                <Pressable
                  key={option}
                  onPress={() => setLaundryFilter(option)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Add Item</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Item name"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.chipRow}>
            {CATEGORIES.map((option) => {
              const selected = option === category;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chipRow}>
            {CARE_OPTIONS.map((option) => {
              const selected = option === careInstructions;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCareInstructions(option)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chipRow}>
            {[
              { label: 'Auto dirty on wear', value: true },
              { label: 'Track only', value: false },
            ].map((option) => {
              const selected = option.value === autoDirtyOnWear;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setAutoDirtyOnWear(option.value)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Brand"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="Color"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Price in dollars"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="Tags, comma separated"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!name.trim()) {
                return;
              }

              createClothingItem(db, uuid(), {
                name: name.trim(),
                category,
                brand: brand.trim() || null,
                color: color.trim() || null,
                purchasePriceCents: price.trim() ? Math.round(Number(price) * 100) : null,
                tags: splitTags(tags),
                careInstructions,
                autoDirtyOnWear,
              });
              setName('');
              setBrand('');
              setColor('');
              setPrice('');
              setTags('');
              setCareInstructions('machine_wash');
              setAutoDirtyOnWear(true);
              refresh();
            }}
          >
            <Text variant="label" color={colors.background}>Save Item</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Catalog</Text>
        <View style={styles.list}>
          {items.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              Your closet is empty.
            </Text>
          ) : (
            items.map((item) => (
              <Card key={item.id} style={styles.innerCard}>
                <Text variant="body">{item.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {item.category}
                  {item.brand ? ` · ${item.brand}` : ''}
                  {item.color ? ` · ${item.color}` : ''}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {item.laundryStatus} · {item.careInstructions.replace('_', ' ')} · wears since wash {item.wearsSinceWash}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Worn {item.timesWorn} times
                  {item.tags.length > 0 ? ` · ${item.tags.join(', ')}` : ''}
                </Text>
              </Card>
            ))
          )}
        </View>
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
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    minWidth: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    gap: 4,
  },
  statValue: {
    color: CLOSET_ACCENT,
    fontSize: 22,
    fontWeight: '700',
  },
  formGrid: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    backgroundColor: CLOSET_ACCENT,
    borderColor: CLOSET_ACCENT,
  },
  primaryButton: {
    backgroundColor: CLOSET_ACCENT,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  innerCard: {
    gap: spacing.xs,
  },
});
