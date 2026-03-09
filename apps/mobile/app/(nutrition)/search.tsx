import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  searchFoods,
  searchFoodsFTS,
  type Food,
  type FoodSource,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.nutrition;

type Tab = 'all' | 'usda' | 'packaged' | 'custom' | 'recent';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'usda', label: 'USDA' },
  { key: 'packaged', label: 'Packaged' },
  { key: 'custom', label: 'Custom' },
  { key: 'recent', label: 'Recent' },
];

const SOURCE_FILTER: Record<Tab, FoodSource[] | null> = {
  all: null,
  usda: ['usda'],
  packaged: ['open_food_facts', 'fatsecret'],
  custom: ['custom', 'ai_photo'],
  recent: null,
};

export default function SearchScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const results = useCallback((): Food[] => {
    if (query.length < 2 && activeTab !== 'recent') return [];

    let foods: Food[];
    try {
      foods = query.length >= 2 ? searchFoodsFTS(db, query, 50) : [];
    } catch {
      foods = query.length >= 2 ? searchFoods(db, query, 50) : [];
    }

    // For "recent" tab with no query, show all foods sorted by recency
    if (activeTab === 'recent' && query.length < 2) {
      foods = searchFoods(db, '', 50);
    }

    const sources = SOURCE_FILTER[activeTab];
    if (sources) {
      foods = foods.filter((f) => sources.includes(f.source));
    }

    return foods;
  }, [db, query, activeTab])();

  return (
    <View style={styles.screen}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              variant="caption"
              color={activeTab === tab.key ? ACCENT : colors.textSecondary}
              style={activeTab === tab.key ? styles.tabLabelActive : undefined}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickButton}
          onPress={() => router.push('/(nutrition)/scan')}
        >
          <Text variant="caption" color={ACCENT}>Scan Barcode</Text>
        </Pressable>
        <Pressable
          style={styles.quickButton}
          onPress={() => router.push('/(nutrition)/photo')}
        >
          <Text variant="caption" color={ACCENT}>Photo Log</Text>
        </Pressable>
      </View>

      {/* Results */}
      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        {results.length === 0 && query.length >= 2 && (
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>
              No foods found for "{query}"
            </Text>
          </View>
        )}
        {results.map((food) => (
          <Pressable
            key={food.id}
            onPress={() => router.push(`/(nutrition)/food/${food.id}`)}
          >
            <Card style={styles.foodCard}>
              <View style={styles.foodCardTop}>
                <View style={styles.foodCardInfo}>
                  <Text variant="body">{food.name}</Text>
                  {food.brand && (
                    <Text variant="caption" color={colors.textSecondary}>
                      {food.brand}
                    </Text>
                  )}
                </View>
                <Text style={styles.calText}>{Math.round(food.calories)} cal</Text>
              </View>
              <View style={styles.macroChips}>
                <MacroChip label="P" value={food.proteinG} />
                <MacroChip label="C" value={food.carbsG} />
                <MacroChip label="F" value={food.fatG} />
              </View>
              <Text variant="caption" color={colors.textTertiary}>
                per {food.servingSize}{food.servingUnit}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function MacroChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.chip}>
      <Text variant="caption" color={colors.textSecondary}>
        {label}: {Math.round(value)}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: ACCENT + '20',
  },
  tabLabelActive: { fontWeight: '600' },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  results: { flex: 1 },
  resultsContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  emptyState: { paddingVertical: spacing.xl, alignItems: 'center' },
  foodCard: { gap: spacing.xs },
  foodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodCardInfo: { flex: 1, gap: 2 },
  calText: { fontSize: 16, fontWeight: '700', color: ACCENT },
  macroChips: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
});
