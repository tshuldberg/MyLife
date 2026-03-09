import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getFoodById,
  getFoodNutrients,
  getNutrientById,
  createFoodLogEntry,
  addFoodLogItem,
  getFoodLogEntries,
  type Food,
  type MealType,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';
import { uuid } from '../../../lib/uuid';

const ACCENT = colors.modules.nutrition;
const SERVING_MULTIPLIERS = [0.5, 1, 1.5, 2, 3];
const MEAL_OPTIONS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();
  const router = useRouter();
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');

  const food: Food | null = useMemo(() => getFoodById(db, id), [db, id]);

  const nutrients = useMemo(() => {
    if (!food) return [];
    return getFoodNutrients(db, food.id).map((fn) => {
      const nutrient = getNutrientById(db, fn.nutrientId);
      return {
        ...fn,
        name: nutrient?.name ?? 'Unknown',
        unit: nutrient?.unit ?? '',
        rdaValue: nutrient?.rdaValue ?? null,
      };
    });
  }, [db, food]);

  const handleAddToLog = useCallback(() => {
    if (!food) return;
    const today = new Date().toISOString().slice(0, 10);

    // Find or create log entry for this meal type today
    const entries = getFoodLogEntries(db, today);
    let logEntry = entries.find((e) => e.mealType === selectedMeal);

    if (!logEntry) {
      const logId = uuid();
      createFoodLogEntry(db, logId, { date: today, mealType: selectedMeal });
      logEntry = { id: logId, date: today, mealType: selectedMeal, notes: null, createdAt: new Date().toISOString() };
    }

    addFoodLogItem(db, uuid(), {
      logId: logEntry.id,
      foodId: food.id,
      servingCount: servingMultiplier,
      calories: Math.round(food.calories * servingMultiplier),
      proteinG: Math.round(food.proteinG * servingMultiplier * 10) / 10,
      carbsG: Math.round(food.carbsG * servingMultiplier * 10) / 10,
      fatG: Math.round(food.fatG * servingMultiplier * 10) / 10,
    });

    Alert.alert(
      'Added',
      `${food.name} added to ${selectedMeal}.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }, [db, food, servingMultiplier, selectedMeal, router]);

  if (!food) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>Food not found.</Text>
        </View>
      </View>
    );
  }

  const cal = Math.round(food.calories * servingMultiplier);
  const prot = Math.round(food.proteinG * servingMultiplier * 10) / 10;
  const carb = Math.round(food.carbsG * servingMultiplier * 10) / 10;
  const f = Math.round(food.fatG * servingMultiplier * 10) / 10;
  const fiber = Math.round(food.fiberG * servingMultiplier * 10) / 10;
  const sugar = Math.round(food.sugarG * servingMultiplier * 10) / 10;
  const sodium = Math.round(food.sodiumMg * servingMultiplier);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <Card>
        <Text variant="subheading">{food.name}</Text>
        {food.brand && (
          <Text variant="caption" color={colors.textSecondary}>{food.brand}</Text>
        )}
        <Text variant="caption" color={colors.textTertiary} style={styles.sourceTag}>
          Source: {food.source.replace('_', ' ')}
        </Text>
      </Card>

      {/* Serving picker */}
      <Card>
        <Text variant="body">Serving Size</Text>
        <Text variant="caption" color={colors.textSecondary}>
          {food.servingSize}{food.servingUnit} per serving
        </Text>
        <View style={styles.servingRow}>
          {SERVING_MULTIPLIERS.map((mult) => (
            <Pressable
              key={mult}
              style={[
                styles.servingButton,
                servingMultiplier === mult && styles.servingButtonActive,
              ]}
              onPress={() => setServingMultiplier(mult)}
            >
              <Text
                variant="caption"
                color={servingMultiplier === mult ? ACCENT : colors.textSecondary}
                style={servingMultiplier === mult ? { fontWeight: '700' } : undefined}
              >
                {mult}x
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Nutrition facts */}
      <Card>
        <Text variant="subheading">Nutrition Facts</Text>
        <View style={styles.factsTable}>
          <FactRow label="Calories" value={`${cal}`} bold />
          <FactRow label="Total Fat" value={`${f}g`} />
          <FactRow label="Total Carbohydrates" value={`${carb}g`} />
          <FactRow label="  Dietary Fiber" value={`${fiber}g`} indent />
          <FactRow label="  Sugars" value={`${sugar}g`} indent />
          <FactRow label="Protein" value={`${prot}g`} />
          <FactRow label="Sodium" value={`${sodium}mg`} />
        </View>
      </Card>

      {/* Micronutrients */}
      {nutrients.length > 0 && (
        <Card>
          <Text variant="subheading">Micronutrients</Text>
          <View style={styles.factsTable}>
            {nutrients.map((n) => {
              const amount = Math.round(n.amount * servingMultiplier * 100) / 100;
              const rdaPct = n.rdaValue
                ? Math.round((amount / n.rdaValue) * 100)
                : null;
              return (
                <View key={n.id} style={styles.factRow}>
                  <Text variant="caption" color={colors.text} style={{ flex: 1 }}>
                    {n.name}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {amount}{n.unit}
                    {rdaPct !== null ? ` (${rdaPct}% RDA)` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Meal picker + Add */}
      <Card>
        <Text variant="body">Add to Meal</Text>
        <View style={styles.mealRow}>
          {MEAL_OPTIONS.map((meal) => (
            <Pressable
              key={meal.key}
              style={[
                styles.mealButton,
                selectedMeal === meal.key && styles.mealButtonActive,
              ]}
              onPress={() => setSelectedMeal(meal.key)}
            >
              <Text
                variant="caption"
                color={selectedMeal === meal.key ? ACCENT : colors.textSecondary}
                style={selectedMeal === meal.key ? { fontWeight: '600' } : undefined}
              >
                {meal.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.addButton} onPress={handleAddToLog}>
          <Text variant="label" color={colors.background}>
            Add to Log ({cal} cal)
          </Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

function FactRow({
  label,
  value,
  bold,
  indent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <View style={[styles.factRow, bold && styles.factRowBold]}>
      <Text
        variant="caption"
        color={indent ? colors.textSecondary : colors.text}
        style={bold ? { fontWeight: '700' } : undefined}
      >
        {label}
      </Text>
      <Text
        variant="caption"
        color={colors.textSecondary}
        style={bold ? { fontWeight: '700', color: colors.text } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sourceTag: { marginTop: spacing.xs },
  servingRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  servingButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servingButtonActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT + '20',
  },
  factsTable: { marginTop: spacing.sm, gap: 1 },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  factRowBold: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  mealRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  mealButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  mealButtonActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT + '20',
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
