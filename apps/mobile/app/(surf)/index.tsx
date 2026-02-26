import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { SurfSpot } from '@mylife/surf';
import {
  countFavoriteSpots,
  countSessions,
  countSpots,
  getAverageWaveHeightFt,
  getSpots,
  toggleSpotFavorite,
} from '@mylife/surf';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

interface Overview {
  spots: number;
  favorites: number;
  avgWaveHeightFt: number;
  sessions: number;
}

export default function SurfHomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [overview, setOverview] = useState<Overview>({
    spots: 0,
    favorites: 0,
    avgWaveHeightFt: 0,
    sessions: 0,
  });
  const [spots, setSpots] = useState<SurfSpot[]>([]);

  const loadData = useCallback(() => {
    setOverview({
      spots: countSpots(db),
      favorites: countFavoriteSpots(db),
      avgWaveHeightFt: getAverageWaveHeightFt(db),
      sessions: countSessions(db),
    });
    setSpots(getSpots(db));
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topSpots = useMemo(() => spots.slice(0, 6), [spots]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.metricGrid}>
        <MetricCard label="Tracked Spots" value={String(overview.spots)} />
        <MetricCard label="Favorites" value={String(overview.favorites)} />
        <MetricCard label="Avg Wave" value={`${overview.avgWaveHeightFt.toFixed(1)} ft`} />
        <MetricCard label="Sessions" value={String(overview.sessions)} />
      </View>

      <View style={styles.section}>
        <Text variant="subheading">Spot Feed</Text>
        <View style={styles.list}>
          {topSpots.map((spot) => (
            <Card key={spot.id}>
              <View style={styles.itemHeader}>
                <Pressable style={styles.itemCopy} onPress={() => router.push(`/(surf)/spot/${spot.id}` as never)}>
                  <Text variant="body">{spot.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {spot.region} · {spot.breakType} · {spot.waveHeightFt.toFixed(1)} ft · {spot.windKts.toFixed(0)} kts
                  </Text>
                </Pressable>
                <Pressable onPress={() => {
                  toggleSpotFavorite(db, spot.id);
                  loadData();
                }}>
                  <Text variant="label" color={spot.isFavorite ? colors.modules.surf : colors.textSecondary}>
                    {spot.isFavorite ? '★' : '☆'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))}
          {spots.length === 0 && (
            <Card>
              <Text variant="caption" color={colors.textSecondary}>No spots yet. Add one in Map.</Text>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="heading" style={styles.metricValue}>{value}</Text>
    </Card>
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
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
  },
  metricValue: {
    color: colors.modules.surf,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
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
