import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getFoodLogEntries,
  getFoodLogItems,
  getFoodById,
  getDailyTotals,
  getActiveGoals,
  isInEatingWindow,
  deleteFoodLogItem,
  type FoodLogEntry,
  type FoodLogItem,
  type Food,
  type DailyTotals,
  type DailyGoals,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.nutrition;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};
const MEAL_ICONS: Record<string, string> = {
  breakfast: '\u2600\ufe0f',
  lunch: '\ud83c\udf1e',
  dinner: '\ud83c\udf19',
  snack: '\ud83c\udf6a',
};
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: string): string {
  const today = formatDate(new Date());
  if (date === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === formatDate(yesterday)) return 'Yesterday';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface MealGroup {
  entry: FoodLogEntry;
  items: (FoodLogItem & { food: Food | null })[];
  totalCalories: number;
}

export default function DiaryScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  };

  const totals: DailyTotals = useMemo(
    () => getDailyTotals(db, selectedDate),
    [db, selectedDate, tick],
  );

  const goals: DailyGoals | null = useMemo(
    () => getActiveGoals(db, selectedDate),
    [db, selectedDate, tick],
  );

  const eatingWindowStatus = useMemo(() => isInEatingWindow(db), [db, tick]);

  const mealGroups: MealGroup[] = useMemo(() => {
    const entries = getFoodLogEntries(db, selectedDate);
    const groups: MealGroup[] = [];
    for (const entry of entries) {
      const items = getFoodLogItems(db, entry.id).map((item) => ({
        ...item,
        food: getFoodById(db, item.foodId),
      }));
      groups.push({
        entry,
        items,
        totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      });
    }
    // Sort by meal order
    groups.sort(
      (a, b) =>
        MEAL_ORDER.indexOf(a.entry.mealType) -
        MEAL_ORDER.indexOf(b.entry.mealType),
    );
    return groups;
  }, [db, selectedDate, tick]);

  const handleDeleteItem = (itemId: string) => {
    deleteFoodLogItem(db, itemId);
    refresh();
  };

  const calPct = goals
    ? Math.min(Math.round((totals.calories / goals.calories) * 100), 100)
    : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Date selector */}
      <View style={styles.dateRow}>
        <Pressable onPress={() => shiftDate(-1)} hitSlop={8}>
          <Text style={styles.dateArrow}>{'<'}</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedDate(formatDate(new Date()))}>
          <Text variant="subheading">{dateLabel(selectedDate)}</Text>
        </Pressable>
        <Pressable onPress={() => shiftDate(1)} hitSlop={8}>
          <Text style={styles.dateArrow}>{'>'}</Text>
        </Pressable>
      </View>

      {/* Calorie/macro bar */}
      <Card>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text variant="caption" color={colors.textSecondary}>Calories</Text>
            <Text style={[styles.macroValue, { color: ACCENT }]}>
              {Math.round(totals.calories)}
            </Text>
            {goals && (
              <Text variant="caption" color={colors.textTertiary}>
                / {goals.calories}
              </Text>
            )}
          </View>
          <View style={styles.macroItem}>
            <Text variant="caption" color={colors.textSecondary}>Protein</Text>
            <Text style={styles.macroValue}>{Math.round(totals.proteinG)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text variant="caption" color={colors.textSecondary}>Carbs</Text>
            <Text style={styles.macroValue}>{Math.round(totals.carbsG)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text variant="caption" color={colors.textSecondary}>Fat</Text>
            <Text style={styles.macroValue}>{Math.round(totals.fatG)}g</Text>
          </View>
        </View>
        {goals && (
          <View style={styles.progressBarOuter}>
            <View
              style={[
                styles.progressBarInner,
                { width: `${calPct}%` },
              ]}
            />
          </View>
        )}
      </Card>

      {/* Eating window indicator */}
      {eatingWindowStatus !== null && (
        <View style={styles.eatingWindowRow}>
          <View
            style={[
              styles.eatingWindowDot,
              { backgroundColor: eatingWindowStatus ? '#22C55E' : '#EF4444' },
            ]}
          />
          <Text variant="caption" color={colors.textSecondary}>
            {eatingWindowStatus ? 'Eating window open' : 'Fasting period'}
          </Text>
        </View>
      )}

      {/* Meal groups */}
      {MEAL_ORDER.map((mealType) => {
        const group = mealGroups.find((g) => g.entry.mealType === mealType);
        if (!group) return null;
        return (
          <Card key={mealType}>
            <View style={styles.mealHeader}>
              <Text variant="body">
                {MEAL_ICONS[mealType]} {MEAL_LABELS[mealType]}
              </Text>
              <Text variant="caption" color={ACCENT}>
                {Math.round(group.totalCalories)} cal
              </Text>
            </View>
            {group.items.map((item) => (
              <Pressable
                key={item.id}
                style={styles.foodItem}
                onPress={() => {
                  if (item.food) router.push(`/(nutrition)/food/${item.food.id}`);
                }}
                onLongPress={() => handleDeleteItem(item.id)}
              >
                <View style={styles.foodInfo}>
                  <Text variant="body">
                    {item.food?.name ?? 'Unknown food'}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.servingCount}x {item.food?.servingUnit ?? 'serving'}
                  </Text>
                </View>
                <Text variant="body" color={colors.textSecondary}>
                  {Math.round(item.calories)} cal
                </Text>
              </Pressable>
            ))}
          </Card>
        );
      })}

      {mealGroups.length === 0 && (
        <Card>
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>
              No meals logged for this day.
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              Tap + to add food via search, scan, or photo.
            </Text>
          </View>
        </Card>
      )}

      {/* FAB */}
      <View style={styles.fabContainer}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/(nutrition)/search')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 100, gap: spacing.md },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dateArrow: { fontSize: 20, color: ACCENT, fontWeight: '600' },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  progressBarOuter: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 3,
  },
  eatingWindowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  eatingWindowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  foodInfo: { flex: 1, gap: 2 },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.xs },
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: spacing.md,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { fontSize: 28, color: colors.background, fontWeight: '600', marginTop: -2 },
});
