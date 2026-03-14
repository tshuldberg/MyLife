import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  countRecipes,
  getRecipes,
  getMealPlanWeek,
  getShoppingLists,
  type Recipe,
  type MealPlanItem,
  type ShoppingList,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;

function todayWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export default function RecipesHomeScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [totalRecipes, setTotalRecipes] = useState(0);
  const [favorites, setFavorites] = useState(0);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [todayMeals, setTodayMeals] = useState<
    Array<MealPlanItem & { recipe_title: string; recipe_image_uri: string | null }>
  >([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);

  const load = useCallback(() => {
    setTotalRecipes(countRecipes(db));
    setFavorites(countRecipes(db, { is_favorite: true }));
    setRecentRecipes(getRecipes(db, { limit: 5 }));

    const weekStart = todayWeekStart();
    const weekItems = getMealPlanWeek(db, weekStart);
    const todayDow = (new Date().getDay() + 6) % 7;
    setTodayMeals(weekItems.filter((item) => item.day_of_week === todayDow));

    const activeLists = getShoppingLists(db, true);
    setActiveList(activeLists.length > 0 ? activeLists[0] : null);
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Recipes</Text>
          <Text style={styles.metricValue}>{totalRecipes}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text variant="caption" color={colors.textSecondary}>Favorites</Text>
          <Text style={styles.metricValue}>{favorites}</Text>
        </Card>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Kitchen Tools</Text>
          <Pressable onPress={() => router.push('/(recipes)/pantry')}>
            <Text variant="caption" color={ACCENT}>Open Pantry</Text>
          </Pressable>
        </View>
        <Text variant="caption" color={colors.textSecondary}>
          Track staples, see what is expiring, and subtract pantry stock from shopping lists.
        </Text>
      </Card>

      {activeList ? (
        <Pressable onPress={() => router.push({ pathname: '/(recipes)/shopping-list', params: { listId: activeList.id } })}>
          <Card>
            <View style={styles.rowBetween}>
              <Text variant="subheading">Active Shopping List</Text>
              <Text variant="caption" color={ACCENT}>Open</Text>
            </View>
            <Text variant="caption" color={colors.textSecondary}>{activeList.name}</Text>
          </Card>
        </Pressable>
      ) : (
        <View style={styles.rowBetween}>
          <Pressable
            style={styles.toolButton}
            onPress={() => router.push('/(recipes)/shopping-list')}
          >
            <Text variant="label" color={ACCENT}>New Shopping List</Text>
          </Pressable>
          <Pressable
            style={styles.toolButton}
            onPress={() => router.push('/(recipes)/shopping-lists')}
          >
            <Text variant="label" color={ACCENT}>Past Lists</Text>
          </Pressable>
        </View>
      )}

      {todayMeals.length > 0 ? (
        <Card>
          <Text variant="subheading">Today's Meals</Text>
          {todayMeals.map((meal) => (
            <Pressable
              key={meal.id}
              style={styles.mealRow}
              onPress={() => router.push(`/(recipes)/recipe/${meal.recipe_id}`)}
            >
              <Text variant="caption" color={ACCENT} style={styles.mealSlot}>
                {meal.meal_slot}
              </Text>
              <Text variant="body" style={styles.flex1}>{meal.recipe_title}</Text>
            </Pressable>
          ))}
        </Card>
      ) : (
        <Card>
          <Text variant="subheading">Today's Meals</Text>
          <Text variant="caption" color={colors.textSecondary}>
            No meals planned for today.
          </Text>
          <Pressable
            style={styles.linkButton}
            onPress={() => router.push('/(recipes)/meal-plan')}
          >
            <Text variant="label" color={ACCENT}>Plan meals</Text>
          </Pressable>
        </Card>
      )}

      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Recent Recipes</Text>
          <Pressable onPress={() => router.push('/(recipes)/recipes-tab')}>
            <Text variant="caption" color={ACCENT}>See all</Text>
          </Pressable>
        </View>
        {recentRecipes.length > 0 ? (
          recentRecipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={styles.recipeRow}
              onPress={() => router.push(`/(recipes)/recipe/${recipe.id}`)}
            >
              <View style={styles.recipeThumb}>
                <Text style={styles.thumbText}>{recipe.title.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.flex1}>
                <Text variant="body">{recipe.title}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {recipe.difficulty ?? 'unset'}{recipe.total_time_mins ? ` \u00B7 ${recipe.total_time_mins}min` : ''}
                </Text>
              </View>
              {recipe.is_favorite ? (
                <Text color={ACCENT}>{'\u2605'}</Text>
              ) : null}
            </Pressable>
          ))
        ) : (
          <Text variant="caption" color={colors.textSecondary}>
            No recipes yet. Add your first one!
          </Text>
        )}
      </Card>

      <Pressable
        style={styles.addButton}
        onPress={() => router.push('/(recipes)/add-recipe')}
      >
        <Text variant="label" color={colors.background}>Add Recipe</Text>
      </Pressable>

      <Pressable
        style={styles.settingsLink}
        onPress={() => router.push('/(recipes)/settings')}
      >
        <Text variant="caption" color={colors.textSecondary}>Settings</Text>
      </Pressable>
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
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    gap: spacing.xs,
  },
  metricValue: {
    color: ACCENT,
    fontSize: 28,
    fontWeight: '700',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealSlot: {
    textTransform: 'capitalize',
    width: 70,
    fontWeight: '600',
  },
  flex1: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recipeThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  settingsLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkButton: {
    marginTop: spacing.xs,
  },
  toolButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
