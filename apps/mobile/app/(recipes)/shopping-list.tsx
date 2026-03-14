import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  createShoppingList,
  getShoppingListById,
  getShoppingListItems,
  addCustomItem,
  addRecipeToShoppingList,
  removeRecipeFromShoppingList,
  toggleItemChecked,
  deleteShoppingListItem,
  addCheckedItemsToPantry,
  getRecipesInShoppingList,
  completeShoppingList,
  getRecipes,
  type ShoppingListItemRow,
  type Recipe,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const ACCENT = colors.modules.recipes;

const SECTION_LABELS: Record<string, string> = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Seafood',
  pantry: 'Pantry',
  frozen: 'Frozen',
  bakery: 'Bakery',
  beverages: 'Beverages',
  snacks: 'Snacks',
  condiments: 'Condiments & Sauces',
  other: 'Other',
};

interface SectionData {
  title: string;
  data: ShoppingListItemRow[];
}

export default function ShoppingListScreen() {
  const { listId: paramListId } = useLocalSearchParams<{ listId?: string }>();
  const router = useRouter();
  const db = useDatabase();

  const [listId, setListId] = useState(paramListId ?? '');
  const [listName, setListName] = useState('');
  const [items, setItems] = useState<ShoppingListItemRow[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [customText, setCustomText] = useState('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([]);
  const [addedRecipes, setAddedRecipes] = useState<Array<{ recipe_id: string; recipe_title: string; multiplier: number }>>([]);
  const [checkedCount, setCheckedCount] = useState(0);

  // Create or load list
  useEffect(() => {
    if (paramListId) {
      const existing = getShoppingListById(db, paramListId);
      if (existing) {
        setListName(existing.name);
        setListId(paramListId);
      }
    } else {
      const id = uuid();
      const name = `Shopping List - ${new Date().toLocaleDateString()}`;
      createShoppingList(db, id, name);
      setListId(id);
      setListName(name);
    }
  }, [db, paramListId]);

  const reload = useCallback(() => {
    if (!listId) return;
    const allItems = getShoppingListItems(db, listId);
    setItems(allItems);
    setCheckedCount(allItems.filter((i) => i.is_checked).length);

    // Group by grocery section
    const grouped = new Map<string, ShoppingListItemRow[]>();
    for (const item of allItems) {
      const section = item.grocery_section || 'other';
      if (!grouped.has(section)) grouped.set(section, []);
      grouped.get(section)!.push(item);
    }

    const sectionData: SectionData[] = [];
    for (const [key, data] of grouped) {
      sectionData.push({ title: SECTION_LABELS[key] ?? key, data });
    }
    setSections(sectionData);

    setAddedRecipes(getRecipesInShoppingList(db, listId));
  }, [db, listId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAddCustomItem = () => {
    const trimmed = customText.trim();
    if (!trimmed || !listId) return;
    addCustomItem(db, uuid(), listId, trimmed);
    setCustomText('');
    reload();
  };

  const handleAddRecipe = (recipe: Recipe, multiplier: number) => {
    if (!listId) return;
    addRecipeToShoppingList(db, listId, recipe.id, multiplier, uuid);
    setShowRecipePicker(false);
    setRecipeSearch('');
    reload();
  };

  const handleRemoveRecipe = (recipeId: string) => {
    if (!listId) return;
    Alert.alert('Remove Recipe', 'Remove all ingredients from this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeRecipeFromShoppingList(db, listId, recipeId);
          reload();
        },
      },
    ]);
  };

  const handleToggleItem = (itemId: string) => {
    toggleItemChecked(db, itemId);
    reload();
  };

  const handleDeleteItem = (itemId: string) => {
    deleteShoppingListItem(db, itemId);
    reload();
  };

  const handleComplete = () => {
    if (!listId) return;
    const checked = items.filter((i) => i.is_checked).length;
    if (checked === 0) {
      Alert.alert('No Items Checked', 'Check off items as you shop before completing.');
      return;
    }

    Alert.alert(
      'Complete Shopping Trip',
      `Add ${checked} checked item(s) to your pantry?`,
      [
        {
          text: 'Just Complete',
          onPress: () => {
            completeShoppingList(db, listId);
            router.back();
          },
        },
        {
          text: 'Add to Pantry & Complete',
          onPress: () => {
            const added = addCheckedItemsToPantry(db, listId, uuid);
            completeShoppingList(db, listId);
            Alert.alert('Done', `${added} new item(s) added to pantry.`);
            router.back();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const searchRecipes = (query: string) => {
    setRecipeSearch(query);
    if (query.trim()) {
      setRecipeResults(getRecipes(db, { search: query.trim() }));
    } else {
      setRecipeResults(getRecipes(db).slice(0, 20));
    }
  };

  const openRecipePicker = () => {
    setShowRecipePicker(true);
    setRecipeResults(getRecipes(db).slice(0, 20));
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.listNameInput}
          value={listName}
          onChangeText={setListName}
          placeholder="List name"
          placeholderTextColor={colors.textTertiary}
        />
        <Text variant="caption" color={colors.textSecondary}>
          {checkedCount}/{items.length} checked
        </Text>
      </View>

      {/* Add Items Section */}
      <Card style={styles.addCard}>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, styles.flex1]}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Add item (e.g. 2 cups flour)"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            onSubmitEditing={handleAddCustomItem}
          />
          <Pressable style={styles.addButton} onPress={handleAddCustomItem}>
            <Text variant="label" color={colors.background}>+</Text>
          </Pressable>
        </View>

        <Pressable style={styles.recipeButton} onPress={openRecipePicker}>
          <Text variant="body" color={ACCENT}>+ Add from Recipe</Text>
        </Pressable>
      </Card>

      {/* Recipe Picker */}
      {showRecipePicker ? (
        <Card style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text variant="subheading">Choose Recipe</Text>
            <Pressable onPress={() => setShowRecipePicker(false)}>
              <Text variant="label" color={colors.danger}>Close</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={recipeSearch}
            onChangeText={searchRecipes}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textTertiary}
          />
          <FlatList
            data={recipeResults}
            keyExtractor={(item) => item.id}
            style={styles.pickerList}
            renderItem={({ item }) => (
              <Pressable
                style={styles.recipeRow}
                onPress={() => handleAddRecipe(item, 1)}
              >
                <View style={styles.flex1}>
                  <Text variant="body">{item.title}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.servings ? `${item.servings} servings` : ''}
                  </Text>
                </View>
                <View style={styles.multiplierRow}>
                  <Pressable
                    style={styles.multiplierBtn}
                    onPress={() => handleAddRecipe(item, 1)}
                  >
                    <Text variant="caption" color={ACCENT}>1x</Text>
                  </Pressable>
                  <Pressable
                    style={styles.multiplierBtn}
                    onPress={() => handleAddRecipe(item, 2)}
                  >
                    <Text variant="caption" color={ACCENT}>2x</Text>
                  </Pressable>
                  <Pressable
                    style={styles.multiplierBtn}
                    onPress={() => handleAddRecipe(item, 3)}
                  >
                    <Text variant="caption" color={ACCENT}>3x</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text variant="caption" color={colors.textSecondary} style={styles.emptyText}>
                No recipes found
              </Text>
            }
          />
        </Card>
      ) : null}

      {/* Added Recipes */}
      {addedRecipes.length > 0 ? (
        <Card style={styles.recipesCard}>
          <Text variant="caption" color={colors.textSecondary}>RECIPES IN LIST</Text>
          {addedRecipes.map((r) => (
            <View key={r.recipe_id} style={styles.addedRecipeRow}>
              <View style={styles.flex1}>
                <Text variant="body">{r.recipe_title}</Text>
                <Text variant="caption" color={colors.textSecondary}>{r.multiplier}x</Text>
              </View>
              <Pressable onPress={() => handleRemoveRecipe(r.recipe_id)}>
                <Text variant="caption" color={colors.danger}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Shopping List Items */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemRow}
            onPress={() => handleToggleItem(item.id)}
            onLongPress={() => {
              Alert.alert('Delete Item', `Remove "${item.item}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(item.id) },
              ]);
            }}
          >
            <View style={[styles.checkbox, item.is_checked ? styles.checkboxChecked : null]}>
              {item.is_checked ? <Text style={styles.checkmark}>{'✓'}</Text> : null}
            </View>
            <View style={styles.flex1}>
              <Text
                variant="body"
                color={item.is_checked ? colors.textTertiary : colors.text}
                style={item.is_checked ? styles.strikethrough : undefined}
              >
                {item.quantity ? `${item.quantity} ` : ''}
                {item.unit ? `${item.unit} ` : ''}
                {item.item}
              </Text>
            </View>
            {item.is_custom ? (
              <Text variant="caption" color={colors.textTertiary}>custom</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text variant="body" color={colors.textSecondary} style={styles.emptyText}>
            Add items above to start your shopping list
          </Text>
        }
      />

      {/* Complete Button */}
      {items.length > 0 ? (
        <View style={styles.footer}>
          <Pressable style={styles.completeButton} onPress={handleComplete}>
            <Text variant="label" color={colors.background}>
              Complete Shopping Trip
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listNameInput: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  addCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.xs,
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
  flex1: {
    flex: 1,
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pickerCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    maxHeight: 300,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pickerList: {
    maxHeight: 200,
    marginTop: spacing.xs,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  multiplierRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  multiplierBtn: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  recipesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  addedRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 1,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  checkmark: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  completeButton: {
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
