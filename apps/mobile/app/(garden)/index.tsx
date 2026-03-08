import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getPlants,
  getGardenStats,
  getWateringSchedule,
  type Plant,
  type WateringScheduleItem,
} from '@mylife/garden';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function GardenHomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick, setTick] = useState(0);

  const stats = useMemo(() => getGardenStats(db), [db, tick]);
  const schedule = useMemo(() => getWateringSchedule(db), [db, tick]);
  const plants = useMemo(() => getPlants(db, { limit: 20 }), [db, tick]);

  const accentColor = '#22C55E';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <NavButton label="Add Plant" accent={accentColor} onPress={() => router.push('/(garden)/add-plant')} />
        <NavButton label="Journal" accent={accentColor} onPress={() => router.push('/(garden)/journal')} />
        <NavButton label="Seeds" accent={accentColor} onPress={() => router.push('/(garden)/seeds')} />
        <NavButton label="Settings" accent={accentColor} onPress={() => router.push('/(garden)/settings')} />
      </View>

      <View style={styles.metricsGrid}>
        <Metric label="Plants" value={String(stats.totalPlants)} accent={accentColor} />
        <Metric label="Healthy" value={String(stats.healthyCount)} accent={accentColor} />
        <Metric label="Overdue" value={String(stats.overdueWateringCount)} accent={stats.overdueWateringCount > 0 ? colors.danger : accentColor} />
        <Metric label="Harvested" value={stats.totalHarvestGrams > 0 ? `${(stats.totalHarvestGrams / 1000).toFixed(1)}kg` : '0'} accent={accentColor} />
      </View>

      {schedule.length > 0 && (
        <Card>
          <Text variant="subheading">Watering Schedule</Text>
          <View style={styles.list}>
            {schedule.slice(0, 5).map((item) => (
              <WateringRow key={item.plantId} item={item} />
            ))}
          </View>
        </Card>
      )}

      <Card>
        <Text variant="subheading">My Plants</Text>
        <View style={styles.list}>
          {plants.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No plants yet. Tap Add Plant to get growing!
              </Text>
            </View>
          ) : (
            plants.map((plant) => (
              <PlantRow key={plant.id} plant={plant} onPress={() => router.push(`/(garden)/plant-detail?id=${plant.id}`)} />
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function WateringRow({ item }: { item: WateringScheduleItem }) {
  return (
    <Card style={[styles.innerCard, item.isOverdue ? styles.overdueCard : null]}>
      <View style={styles.rowBetween}>
        <Text variant="body">{item.plantName}</Text>
        <Text variant="caption" color={item.isOverdue ? colors.danger : colors.textSecondary}>
          {item.isOverdue ? `${item.daysOverdue}d overdue` : item.nextWaterDate ?? 'never watered'}
        </Text>
      </View>
    </Card>
  );
}

function PlantRow({ plant, onPress }: { plant: Plant; onPress: () => void }) {
  const statusColors: Record<string, string> = {
    healthy: '#22C55E',
    needs_attention: '#F59E0B',
    dormant: '#64748B',
    dead: '#EF4444',
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.innerCard}>
        <View style={styles.rowBetween}>
          <View style={styles.mainCopy}>
            <Text variant="body">{plant.name}</Text>
            {plant.species && (
              <Text variant="caption" color={colors.textSecondary}>{plant.species}</Text>
            )}
          </View>
          <View style={[styles.statusDot, { backgroundColor: statusColors[plant.status] ?? '#64748B' }]} />
        </View>
      </Card>
    </Pressable>
  );
}

function NavButton({ label, accent, onPress }: { label: string; accent: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.navButton, { borderColor: accent }]} onPress={onPress}>
      <Text variant="caption" color={accent}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  navButton: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flex: 1, minWidth: 75, gap: spacing.xs },
  metricValue: { fontSize: 22, fontWeight: '700' },
  list: { marginTop: spacing.sm },
  innerCard: { marginBottom: spacing.sm, backgroundColor: colors.surfaceElevated },
  overdueCard: { borderWidth: 1, borderColor: 'rgba(239, 68, 58, 0.3)' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  mainCopy: { flex: 1, gap: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
