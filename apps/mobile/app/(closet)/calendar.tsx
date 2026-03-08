import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { listClothingItems, listOutfits, listWearLogs, logWearEvent } from '@mylife/closet';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const CLOSET_ACCENT = '#E879A8';

function toggleItem(values: string[], itemId: string): string[] {
  return values.includes(itemId)
    ? values.filter((value) => value !== itemId)
    : [...values, itemId];
}

export default function ClosetCalendarScreen() {
  const db = useDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((value) => value + 1);
  const items = useMemo(() => listClothingItems(db, { status: 'active', limit: 200 }), [db, tick]);
  const outfits = useMemo(() => listOutfits(db), [db, tick]);
  const wearLogs = useMemo(() => listWearLogs(db, { limit: 20 }), [db, tick]);
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Log Today&apos;s Wear</Text>
        <View style={styles.formGrid}>
          <Text variant="caption" color={colors.textSecondary}>Saved outfits</Text>
          <View style={styles.chipRow}>
            {outfits.map((outfit) => {
              const selected = selectedOutfitId === outfit.id;
              return (
                <Pressable
                  key={outfit.id}
                  onPress={() => setSelectedOutfitId(selected ? null : outfit.id)}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {outfit.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" color={colors.textSecondary}>Or pick items manually</Text>
          <View style={styles.chipRow}>
            {items.map((item) => {
              const selected = selectedItemIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedItemIds((value) => toggleItem(value, item.id))}
                  style={[styles.chip, selected ? styles.chipActive : null]}
                >
                  <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!selectedOutfitId && selectedItemIds.length === 0) {
                return;
              }

              logWearEvent(db, uuid(), {
                date: today,
                outfitId: selectedOutfitId,
                itemIds: selectedItemIds,
                notes: notes.trim() || null,
              });
              setSelectedOutfitId(null);
              setSelectedItemIds([]);
              setNotes('');
              refresh();
            }}
          >
            <Text variant="label" color={colors.background}>Log Wear</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Recent Wear</Text>
        <View style={styles.list}>
          {wearLogs.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              No wear logs yet.
            </Text>
          ) : (
            wearLogs.map((log) => (
              <Card key={log.id} style={styles.innerCard}>
                <Text variant="body">{log.date}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {log.itemIds.map((itemId) => itemMap.get(itemId)?.name ?? 'Unknown').join(', ')}
                </Text>
                {log.notes ? (
                  <Text variant="caption" color={colors.textSecondary}>{log.notes}</Text>
                ) : null}
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
