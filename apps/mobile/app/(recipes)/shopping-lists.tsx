import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getShoppingLists,
  deleteShoppingList,
  getShoppingListSummary,
  type ShoppingList,
  type ShoppingListSummary,
} from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;

export default function ShoppingListsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [lists, setLists] = useState<Array<ShoppingList & { summary: ShoppingListSummary | null }>>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(() => {
    const raw = getShoppingLists(db, !showCompleted);
    const withSummary = raw.map((list) => ({
      ...list,
      summary: getShoppingListSummary(db, list.id),
    }));
    setLists(withSummary);
  }, [db, showCompleted]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete List', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteShoppingList(db, id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text variant="subheading">Shopping Lists</Text>
        <Pressable
          style={styles.newButton}
          onPress={() => router.push('/(recipes)/shopping-list')}
        >
          <Text variant="label" color={colors.background}>+ New List</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.toggleRow}
        onPress={() => setShowCompleted(!showCompleted)}
      >
        <Text variant="caption" color={ACCENT}>
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </Text>
      </Pressable>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(recipes)/shopping-list', params: { listId: item.id } })}
            onLongPress={() => handleDelete(item.id, item.name)}
          >
            <Card>
              <View style={styles.rowBetween}>
                <View style={styles.flex1}>
                  <Text variant="body">{item.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.summary
                      ? `${item.summary.checkedItems}/${item.summary.totalItems} items`
                      : '0 items'}
                    {item.summary && item.summary.recipeCount > 0
                      ? ` from ${item.summary.recipeCount} recipe(s)`
                      : ''}
                  </Text>
                </View>
                {!item.is_active ? (
                  <Text variant="caption" color={colors.success}>Completed</Text>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body" color={colors.textSecondary}>
              No shopping lists yet.
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Tap "+ New List" to create one.
            </Text>
          </View>
        }
      />
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
    paddingVertical: spacing.md,
  },
  newButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
});
