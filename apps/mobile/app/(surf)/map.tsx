import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { SurfSpot } from '@mylife/surf';
import {
  createSpot,
  getSpots,
  toggleSpotFavorite,
} from '@mylife/surf';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function SurfMapScreen() {
  const db = useDatabase();

  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [regionFilter, setRegionFilter] = useState('all');

  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [breakType, setBreakType] = useState<SurfSpot['breakType']>('beach');

  const loadData = useCallback(() => {
    setSpots(
      getSpots(db, {
        region: regionFilter === 'all' ? undefined : regionFilter,
      }),
    );
  }, [db, regionFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const regions = useMemo(() => {
    const set = new Set(getSpots(db).map((spot) => spot.region));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [db, spots]);

  const handlePin = () => {
    if (!name.trim() || !region.trim()) return;
    createSpot(db, makeId('spot'), {
      name: name.trim(),
      region: region.trim(),
      breakType,
      waveHeightFt: 0,
      windKts: 0,
      tide: 'mid',
      swellDirection: 'W',
      isFavorite: false,
    });
    setName('');
    loadData();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <Text variant="subheading">Map Control</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.hint}>
          Region filters and spot pinning are available now.
        </Text>

        <View style={styles.rowWrap}>
          {regions.map((item) => (
            <Pressable
              key={item}
              onPress={() => setRegionFilter(item)}
              style={[
                styles.chip,
                item === regionFilter && styles.chipActive,
              ]}
            >
              <Text variant="caption" color={item === regionFilter ? colors.modules.surf : colors.textSecondary}>
                {item === 'all' ? 'All regions' : item}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text variant="subheading">Pin Spot</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Spot name"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Region"
            placeholderTextColor={colors.textTertiary}
            value={region}
            onChangeText={setRegion}
          />
          <View style={styles.rowWrap}>
            {(['beach', 'point', 'reef', 'river-mouth', 'other'] as const).map((value) => (
              <Pressable
                key={value}
                style={[
                  styles.chip,
                  breakType === value && styles.chipActive,
                ]}
                onPress={() => setBreakType(value)}
              >
                <Text variant="caption" color={breakType === value ? colors.modules.surf : colors.textSecondary}>
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.primaryButton} onPress={handlePin}>
            <Text variant="label" color={colors.background}>Pin Spot</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.list}>
        {spots.map((spot) => (
          <Card key={spot.id}>
            <View style={styles.itemHeader}>
              <View style={styles.itemCopy}>
                <Text variant="body">{spot.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {spot.region} · {spot.breakType} · {spot.waveHeightFt.toFixed(1)} ft · {spot.windKts.toFixed(0)} kts
                </Text>
              </View>
              <Pressable onPress={() => {
                toggleSpotFavorite(db, spot.id);
                loadData();
              }}>
                <Text variant="label" color={spot.isFavorite ? colors.modules.surf : colors.textSecondary}>
                  {spot.isFavorite ? 'Favorited' : 'Favorite'}
                </Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>
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
  hint: {
    marginTop: spacing.xs,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  form: {
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
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    borderColor: colors.modules.surf,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: colors.modules.surf,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
});
