import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  getCalorieHistory,
  getMacroRatios,
  getMicronutrientDeficiencies,
  type DayTotal,
  type MacroRatios,
  type NutrientDeficiency,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.nutrition;

type Period = '7d' | '30d' | '90d';
const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: '7d', label: 'Week', days: 7 },
  { key: '30d', label: 'Month', days: 30 },
  { key: '90d', label: '3 Months', days: 90 },
];

export default function TrendsScreen() {
  const db = useDatabase();
  const [period, setPeriod] = useState<Period>('7d');
  const days = PERIODS.find((p) => p.key === period)!.days;

  const history: DayTotal[] = useMemo(
    () => getCalorieHistory(db, days),
    [db, days],
  );

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days + 1);
    return d.toISOString().slice(0, 10);
  }, [days]);

  const macroRatios: MacroRatios = useMemo(
    () => getMacroRatios(db, startDate, endDate),
    [db, startDate, endDate],
  );

  const deficiencies: NutrientDeficiency[] = useMemo(
    () => getMicronutrientDeficiencies(db, days),
    [db, days],
  );

  const maxCal = Math.max(...history.map((d) => d.calories), 1);
  const avgCal = history.length > 0
    ? Math.round(history.reduce((s, d) => s + d.calories, 0) / history.length)
    : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.periodButton, period === p.key && styles.periodActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text
              variant="caption"
              color={period === p.key ? ACCENT : colors.textSecondary}
              style={period === p.key ? { fontWeight: '600' } : undefined}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Calorie bar chart */}
      <Card>
        <View style={styles.chartHeader}>
          <Text variant="subheading">Calories</Text>
          <Text variant="caption" color={colors.textSecondary}>
            avg {avgCal} cal/day
          </Text>
        </View>
        <View style={styles.chartContainer}>
          {history.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text variant="body" color={colors.textSecondary}>
                No data for this period.
              </Text>
            </View>
          ) : (
            <View style={styles.barChart}>
              {history.map((day) => {
                const height = Math.max((day.calories / maxCal) * 120, 4);
                const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  { weekday: 'narrow' },
                );
                return (
                  <View key={day.date} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          { height, backgroundColor: ACCENT },
                        ]}
                      />
                    </View>
                    {period === '7d' && (
                      <Text variant="caption" color={colors.textTertiary} style={styles.barLabel}>
                        {dayLabel}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Card>

      {/* Macro split */}
      <Card>
        <Text variant="subheading">Macro Split</Text>
        {macroRatios.totalCalories > 0 ? (
          <>
            <View style={styles.macroSplitBar}>
              {macroRatios.proteinPct > 0 && (
                <View
                  style={[
                    styles.macroSegment,
                    {
                      flex: macroRatios.proteinPct,
                      backgroundColor: '#3B82F6',
                      borderTopLeftRadius: 4,
                      borderBottomLeftRadius: 4,
                    },
                  ]}
                />
              )}
              {macroRatios.carbsPct > 0 && (
                <View
                  style={[
                    styles.macroSegment,
                    { flex: macroRatios.carbsPct, backgroundColor: '#22C55E' },
                  ]}
                />
              )}
              {macroRatios.fatPct > 0 && (
                <View
                  style={[
                    styles.macroSegment,
                    {
                      flex: macroRatios.fatPct,
                      backgroundColor: '#EAB308',
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.macroLegend}>
              <LegendItem color="#3B82F6" label={`Protein ${macroRatios.proteinPct}%`} />
              <LegendItem color="#22C55E" label={`Carbs ${macroRatios.carbsPct}%`} />
              <LegendItem color="#EAB308" label={`Fat ${macroRatios.fatPct}%`} />
            </View>
          </>
        ) : (
          <View style={styles.emptyChart}>
            <Text variant="body" color={colors.textSecondary}>
              No macro data for this period.
            </Text>
          </View>
        )}
      </Card>

      {/* Deficiency alerts */}
      <Card>
        <Text variant="subheading">Deficiency Alerts</Text>
        {deficiencies.length > 0 ? (
          <View style={styles.defList}>
            {deficiencies.map((d) => (
              <View key={d.nutrientId} style={styles.defRow}>
                <View style={styles.defInfo}>
                  <Text variant="body">{d.nutrientName}</Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    avg {Math.round(d.avgConsumed * 10) / 10}{d.unit} / {d.rda}{d.unit} RDA
                  </Text>
                </View>
                <View style={styles.defBadge}>
                  <Text variant="caption" color="#EF4444">
                    {d.avgPercentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text variant="body" color={colors.textSecondary}>
              No consistent deficiencies detected.
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  periodActive: {
    backgroundColor: ACCENT + '20',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartContainer: { marginTop: spacing.sm },
  emptyChart: { paddingVertical: spacing.lg, alignItems: 'center' },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 2,
  },
  barColumn: { flex: 1, alignItems: 'center' },
  barWrapper: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 2 },
  barLabel: { marginTop: 4, fontSize: 9 },
  macroSplitBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  macroSegment: { height: '100%' },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  defList: { marginTop: spacing.sm, gap: spacing.sm },
  defRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  defInfo: { flex: 1, gap: 2 },
  defBadge: {
    backgroundColor: '#EF444420',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
