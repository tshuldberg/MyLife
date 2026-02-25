import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { countFavoriteSpots, countSessions, countSpots } from '@mylife/surf';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

export default function SurfAccountScreen() {
  const db = useDatabase();
  const [waveUnit, setWaveUnit] = useState<'ft' | 'm'>('ft');
  const [windUnit, setWindUnit] = useState<'kts' | 'mph'>('kts');
  const [dailyForecast, setDailyForecast] = useState(true);
  const [swellAlerts, setSwellAlerts] = useState(true);

  const metrics = useMemo(() => ({
    spots: countSpots(db),
    favorites: countFavoriteSpots(db),
    sessions: countSessions(db),
  }), [db]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <Text variant="subheading">Profile</Text>
        <View style={styles.metricRow}>
          <Text variant="body">Tracked Spots</Text>
          <Text variant="body" color={colors.textSecondary}>{metrics.spots}</Text>
        </View>
        <View style={[styles.metricRow, styles.borderTop]}>
          <Text variant="body">Favorites</Text>
          <Text variant="body" color={colors.textSecondary}>{metrics.favorites}</Text>
        </View>
        <View style={[styles.metricRow, styles.borderTop]}>
          <Text variant="body">Sessions</Text>
          <Text variant="body" color={colors.textSecondary}>{metrics.sessions}</Text>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Units</Text>
        <View style={styles.rowWrap}>
          <Pressable style={[styles.chip, waveUnit === 'ft' && styles.chipActive]} onPress={() => setWaveUnit('ft')}>
            <Text variant="caption" color={waveUnit === 'ft' ? colors.modules.surf : colors.textSecondary}>Wave ft</Text>
          </Pressable>
          <Pressable style={[styles.chip, waveUnit === 'm' && styles.chipActive]} onPress={() => setWaveUnit('m')}>
            <Text variant="caption" color={waveUnit === 'm' ? colors.modules.surf : colors.textSecondary}>Wave m</Text>
          </Pressable>
          <Pressable style={[styles.chip, windUnit === 'kts' && styles.chipActive]} onPress={() => setWindUnit('kts')}>
            <Text variant="caption" color={windUnit === 'kts' ? colors.modules.surf : colors.textSecondary}>Wind kts</Text>
          </Pressable>
          <Pressable style={[styles.chip, windUnit === 'mph' && styles.chipActive]} onPress={() => setWindUnit('mph')}>
            <Text variant="caption" color={windUnit === 'mph' ? colors.modules.surf : colors.textSecondary}>Wind mph</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Notifications</Text>
        <Pressable style={styles.metricRow} onPress={() => setDailyForecast((value) => !value)}>
          <Text variant="body">Daily Forecast</Text>
          <Text variant="body" color={dailyForecast ? colors.modules.surf : colors.textTertiary}>
            {dailyForecast ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
        <Pressable style={[styles.metricRow, styles.borderTop]} onPress={() => setSwellAlerts((value) => !value)}>
          <Text variant="body">Swell Alerts</Text>
          <Text variant="body" color={swellAlerts ? colors.modules.surf : colors.textTertiary}>
            {swellAlerts ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
      </Card>
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
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowWrap: {
    marginTop: spacing.sm,
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
});
