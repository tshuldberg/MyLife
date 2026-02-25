import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
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

function stars(rating: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, rating))) || '☆☆☆☆☆';
}

export default function RecipesScreen() {
  const db = useDatabase();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<Difficulty | ''>('');

  const load = useCallback(() => {
    setLoading(true);
    try {
      setRecipes(getRecipes(db, search.trim() ? { search: search.trim() } : undefined));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => ({
    recipes: countRecipes(db),
    favorites: recipes.filter((recipe) => recipe.is_favorite === 1).length,
  }), [db, recipes]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onCreate = () => {
    const clean = title.trim();
    if (!clean) return;
    createRecipe(db, uuid(), {
      title: clean,
      difficulty: difficulty || null,
      rating: 0,
      is_favorite: 0,
    });
    setTitle('');
    setDifficulty('');
    load();
  };

  const startEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setEditTitle(recipe.title);
    setEditDifficulty(recipe.difficulty ?? '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateRecipe(db, editingId, {
      title: editTitle.trim() || 'Untitled',
      difficulty: editDifficulty || null,
    });
    setEditingId(null);
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
            tintColor={colors.modules.recipes}
            colors={[colors.modules.recipes]}
          />
        }
        ListHeaderComponent={
          <>
            <Card style={styles.summaryCard}>
              <Text variant="subheading">Recipe Library</Text>
              <Text variant="caption" color={colors.textSecondary}>
                {totals.recipes} recipes · {totals.favorites} favorites
              </Text>
            </Card>

            <Card>
              <Text variant="subheading">Add Recipe</Text>
              <View style={styles.formGrid}>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Recipe title"
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={styles.row}>
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((value) => {
                    const selected = difficulty === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setDifficulty(selected ? '' : value)}
                        style={[styles.chip, selected ? styles.chipSelected : null]}
                      >
                        <Text
                          variant="caption"
                          color={selected ? colors.background : colors.textSecondary}
                        >
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable style={styles.primaryButton} onPress={onCreate}>
                  <Text variant="label" color={colors.background}>Create</Text>
                </Pressable>
              </View>
            </Card>

            <Card>
              <Text variant="caption" color={colors.textSecondary}>Search</Text>
              <TextInput
                style={styles.input}
                value={search}
                onChangeText={setSearch}
                placeholder="Find recipes"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.secondaryButton} onPress={load}>
                <Text variant="label">Apply</Text>
              </Pressable>
            </Card>
          </>
        }
        renderItem={({ item }) => {
          const editing = editingId === item.id;
          return (
            <Card>
              {editing ? (
                <View style={styles.formGrid}>
                  <TextInput
                    style={styles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Title"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <View style={styles.row}>
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((value) => {
                      const selected = editDifficulty === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => setEditDifficulty(selected ? '' : value)}
                          style={[styles.chip, selected ? styles.chipSelected : null]}
                        >
                          <Text
                            variant="caption"
                            color={selected ? colors.background : colors.textSecondary}
                          >
                            {value}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.rowBetween}>
                    <Pressable style={styles.primaryButton} onPress={saveEdit}>
                      <Text variant="label" color={colors.background}>Save</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => setEditingId(null)}>
                      <Text variant="label">Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.rowBetween}>
                    <View style={styles.mainCopy}>
                      <Text variant="body">{item.title}</Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {item.difficulty ?? 'unspecified'} · {stars(item.rating)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        updateRecipe(db, item.id, { is_favorite: item.is_favorite ? 0 : 1 });
                        load();
                      }}
                    >
                      <Text variant="label" color={item.is_favorite ? colors.modules.recipes : colors.textSecondary}>
                        {item.is_favorite ? '★' : '☆'}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.rowBetween}>
                    <Pressable style={styles.secondaryButton} onPress={() => startEdit(item)}>
                      <Text variant="label">Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.dangerButton}
                      onPress={() => {
                        deleteRecipe(db, item.id);
                        load();
                      }}
                    >
                      <Text variant="label" color={colors.background}>Delete</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No recipes yet.
              </Text>
            </View>
          ) : null
        }
      />
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
  summaryCard: {
    gap: spacing.xs,
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    borderColor: colors.modules.recipes,
    backgroundColor: colors.modules.recipes,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.recipes,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});
