import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getClosetDashboard, getClosetSetting, listClothingItems, setClosetSetting } from '@mylife/closet';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const CLOSET_ACCENT = '#E879A8';
const THRESHOLDS = ['90', '180', '365'];

export default function ClosetSettingsScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((value) => value + 1);
  const items = listClothingItems(db, { status: 'active', limit: 500 });
  const dashboard = getClosetDashboard(db);
  const donationThreshold = getClosetSetting(db, 'donationThresholdDays') ?? '365';

  void tick;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Module Snapshot</Text>
        <View style={styles.list}>
          <Text variant="body">Items: {items.length}</Text>
          <Text variant="body">Outfits: {dashboard.totalOutfits}</Text>
          <Text variant="body">Donation candidates: {dashboard.donationCandidateCount}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Donation Threshold</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Items older than this many days since last wear are suggested for donation in the current hub build.
        </Text>
        <View style={styles.chipRow}>
          {THRESHOLDS.map((value) => {
            const selected = value === donationThreshold;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  setClosetSetting(db, 'donationThresholdDays', value);
                  refresh();
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {value}d
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Spec Gap Check</Text>
        <Text variant="caption" color={colors.textSecondary}>
          Implemented now: wardrobe items, tags, outfits, wear logs, donation suggestions,
          wardrobe value, and settings-driven donation thresholds.
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          Still missing from the full spec: photo capture and quick capture, richer filter sheets,
          cost-per-wear surfaces in UI, laundry workflows, packing lists, AI outfit suggestions,
          seasonal rotation, wishlist, capsule wardrobes, color analysis, style boards, export, and onboarding.
        </Text>
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
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
});
