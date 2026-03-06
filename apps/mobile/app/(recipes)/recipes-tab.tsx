import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  countRecipes,
  createRecipe,
  deleteRecipe,
  getRecipes,
  updateRecipe,
  type Difficulty,
  type Recipe,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const ACCENT = colors.modules.recipes;

type FilterMode = 'all' | 'favorites' | 'easy' | 'medium' | 'hard';

function stars(rating: number): string {
  return '\u2605'.repeat(Math.max(0, Math.min(5, rating))) || '\u2606\u2606\u2606\u2606\u2606';
}

export default function RecipesTabScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const load = useCallback(() => {
    setLoading(true);
    try {
      const filters: Parameters<typeof getRecipes>[1] = {};
      if (search.trim()) filters.search = search.trim();
      if (filter === 'favorites') filters.is_favorite = true;
      if (filter === 'easy' || filter === 'medium' || filter === 'hard') {
        filters.difficulty = filter;
      }
      setRecipes(getRecipes(db, Object.keys(filters).length > 0 ? filters : undefined));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, search, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(() => countRecipes(db), [db]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleFavorite = (recipe: Recipe) => {
    updateRecipe(db, recipe.id, { is_favorite: recipe.is_favorite ? 0 : 1 });
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search recipes..."
                placeholderTextColor={colors.textTertiary}
                returnKeyType="search"
              />
            </View>

            <View style={styles.filterRow}>
              {(['all', 'favorites', 'easy', 'medium', 'hard'] as FilterMode[]).map((mode) => {
                const active = filter === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setFilter(mode)}
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text
                      variant="caption"
                      color={active ? colors.background : colors.textSecondary}
                    >
                      {mode === 'all' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text variant="caption" color={colors.textSecondary} style={styles.countLabel}>
              {total} recipes total
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(recipes)/recipe/${item.id}`)}>
            <Card>
              <View style={styles.rowBetween}>
                <View style={styles.mainCopy}>
                  <Text variant="body">{item.title}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.difficulty ?? 'unset'}
                    {item.total_time_mins ? ` \u00B7 ${item.total_time_mins}min` : ''}
                    {' \u00B7 '}{stars(item.rating)}
                  </Text>
                </View>
                <Pressable onPress={() => toggleFavorite(item)}>
                  <Text
                    variant="label"
                    color={item.is_favorite ? ACCENT : colors.textSecondary}
                  >
                    {item.is_favorite ? '\u2605' : '\u2606'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                {search || filter !== 'all' ? 'No matching recipes.' : 'No recipes yet.'}
              </Text>
              {!search && filter === 'all' ? (
                <Pressable
                  style={styles.addButton}
                  onPress={() => router.push('/(recipes)/add-recipe')}
                >
                  <Text variant="label" color={colors.background}>Add Recipe</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(recipes)/add-recipe')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  searchRow: {
    marginBottom: spacing.xs,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
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
  countLabel: {
    marginBottom: spacing.xs,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: colors.background,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
});
