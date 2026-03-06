import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getMealPlanWeek,
  getRecipes,
  upsertMealPlanItem,
  generateMealPlanShoppingList,
  type Recipe,
  type MealPlanItem,
  type MealSlot,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getWeekStart(offset: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff + offset * 7);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

type MealPlanRow = MealPlanItem & { recipe_title: string; recipe_image_uri: string | null };

export default function MealPlanScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [weekOffset, setWeekOffset] = useState(0);
  const [weekItems, setWeekItems] = useState<MealPlanRow[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<
    Array<{ item: string; quantity: number | null; unit: string | null; in_stock: boolean }>
  >([]);
  const [showShopping, setShowShopping] = useState(false);

  const weekStart = getWeekStart(weekOffset);

  const load = useCallback(() => {
    setWeekItems(getMealPlanWeek(db, weekStart));
    setRecipes(getRecipes(db, { limit: 100 }));
  }, [db, weekStart]);

  useEffect(() => {
    load();
    setShowShopping(false);
  }, [load]);

  const handleAddMeal = (dayOfWeek: number, mealSlot: MealSlot) => {
    if (recipes.length === 0) {
      Alert.alert('No Recipes', 'Add some recipes first before planning meals.');
      return;
    }
    const options = recipes.slice(0, 10).map((r) => r.title);
    options.push('Cancel');

    Alert.alert(`${DAY_NAMES[dayOfWeek]} ${mealSlot}`, 'Choose a recipe', [
      ...recipes.slice(0, 10).map((r) => ({
        text: r.title,
        onPress: () => {
          upsertMealPlanItem(db, {
            weekStartDate: weekStart,
            dayOfWeek: dayOfWeek,
            mealSlot: mealSlot,
            recipeId: r.id,
          });
          load();
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleShoppingList = () => {
    const list = generateMealPlanShoppingList(db, weekStart);
    setShoppingList(list);
    setShowShopping(true);
  };

  const getMealForSlot = (day: number, slot: MealSlot): MealPlanRow | undefined =>
    weekItems.find((item) => item.day_of_week === day && item.meal_slot === slot);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.weekNav}>
          <Pressable onPress={() => setWeekOffset((p) => p - 1)}>
            <Text variant="label" color={ACCENT}>{'\u25C0'} Prev</Text>
          </Pressable>
          <Text variant="subheading">{formatWeekLabel(weekStart)}</Text>
          <Pressable onPress={() => setWeekOffset((p) => p + 1)}>
            <Text variant="label" color={ACCENT}>Next {'\u25B6'}</Text>
          </Pressable>
        </View>
      </Card>

      {DAY_NAMES.map((dayName, dayIndex) => (
        <Card key={dayName}>
          <Text variant="subheading" style={styles.dayHeader}>{dayName}</Text>
          {MEAL_SLOTS.map((slot) => {
            const meal = getMealForSlot(dayIndex, slot);
            return (
              <Pressable
                key={slot}
                style={styles.slotRow}
                onPress={() =>
                  meal
                    ? router.push(`/(recipes)/recipe/${meal.recipe_id}`)
                    : handleAddMeal(dayIndex, slot)
                }
                onLongPress={() => handleAddMeal(dayIndex, slot)}
              >
                <Text variant="caption" color={ACCENT} style={styles.slotLabel}>
                  {slot}
                </Text>
                {meal ? (
                  <Text variant="body" style={styles.flex1}>{meal.recipe_title}</Text>
                ) : (
                  <Text variant="caption" color={colors.textTertiary} style={styles.flex1}>
                    Tap to add
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Card>
      ))}

      <Pressable style={styles.shoppingButton} onPress={handleShoppingList}>
        <Text variant="label" color={colors.background}>Generate Shopping List</Text>
      </Pressable>

      {showShopping && shoppingList.length > 0 ? (
        <Card>
          <Text variant="subheading">Shopping List</Text>
          {shoppingList.map((item, i) => (
            <View key={`${item.item}-${i}`} style={styles.shopRow}>
              <Text
                variant="body"
                color={item.in_stock ? colors.textTertiary : colors.text}
                style={item.in_stock ? styles.strikethrough : undefined}
              >
                {item.quantity ? `${item.quantity} ` : ''}
                {item.unit ? `${item.unit} ` : ''}
                {item.item}
              </Text>
              {item.in_stock ? (
                <Text variant="caption" color={colors.textTertiary}>in stock</Text>
              ) : null}
            </View>
          ))}
        </Card>
      ) : showShopping ? (
        <Card>
          <Text variant="caption" color={colors.textSecondary}>
            No ingredients needed for this week's plan.
          </Text>
        </Card>
      ) : null}
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayHeader: {
    marginBottom: spacing.xs,
    color: ACCENT,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slotLabel: {
    width: 70,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  flex1: {
    flex: 1,
  },
  shoppingButton: {
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  shopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
});
