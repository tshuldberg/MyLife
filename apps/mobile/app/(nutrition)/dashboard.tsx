import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  getDailyGoalProgress,
  getMicronutrientSummary,
  type GoalProgress,
  type NutrientSummaryItem,
  type NutrientStatus,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.nutrition;

const NUTRIENT_GROUPS: Record<string, string[]> = {
  Vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'Thiamin', 'Riboflavin', 'Niacin', 'Vitamin B6', 'Folate', 'Vitamin B12', 'Pantothenic Acid', 'Biotin', 'Choline'],
  Minerals: ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Chromium', 'Molybdenum', 'Iodine', 'Fluoride'],
};

function statusColor(status: NutrientStatus): string {
  switch (status) {
    case 'deficient': return '#EF4444';
    case 'low': return '#EAB308';
    case 'adequate': return '#22C55E';
    case 'excess': return '#3B82F6';
    default: return '#6B6155';
  }
}

export default function DashboardScreen() {
  const db = useDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const progress: GoalProgress | null = useMemo(
    () => getDailyGoalProgress(db, today),
    [db, today],
  );

  const micronutrients: NutrientSummaryItem[] = useMemo(
    () => getMicronutrientSummary(db, today),
    [db, today],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Macro ring charts */}
      <Card>
        <Text variant="subheading">Macros</Text>
        {progress ? (
          <View style={styles.ringRow}>
            <MacroRing
              label="Calories"
              consumed={progress.calories.consumed}
              goal={progress.calories.goal}
              pct={progress.calories.percentage}
              color={ACCENT}
            />
            <MacroRing
              label="Protein"
              consumed={progress.proteinG.consumed}
              goal={progress.proteinG.goal}
              pct={progress.proteinG.percentage}
              color="#3B82F6"
              unit="g"
            />
            <MacroRing
              label="Carbs"
              consumed={progress.carbsG.consumed}
              goal={progress.carbsG.goal}
              pct={progress.carbsG.percentage}
              color="#22C55E"
              unit="g"
            />
            <MacroRing
              label="Fat"
              consumed={progress.fatG.consumed}
              goal={progress.fatG.goal}
              pct={progress.fatG.percentage}
              color="#EAB308"
              unit="g"
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>
              Set daily goals in Settings to see macro progress.
            </Text>
          </View>
        )}
      </Card>

      {/* Micronutrient grid */}
      {Object.entries(NUTRIENT_GROUPS).map(([group, names]) => {
        const groupItems = micronutrients.filter((n) =>
          names.some((name) => n.nutrientName.toLowerCase().includes(name.toLowerCase())),
        );
        if (groupItems.length === 0) return null;

        return (
          <Card key={group}>
            <Text variant="subheading">{group}</Text>
            <View style={styles.nutrientGrid}>
              {groupItems.map((item) => (
                <View key={item.nutrientId} style={styles.nutrientItem}>
                  <View style={styles.nutrientHeader}>
                    <Text variant="caption" style={styles.nutrientName}>
                      {item.nutrientName}
                    </Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      {item.percentage !== null ? `${item.percentage}%` : '--'}
                    </Text>
                  </View>
                  <View style={styles.rdaBarOuter}>
                    <View
                      style={[
                        styles.rdaBarInner,
                        {
                          width: `${Math.min(item.percentage ?? 0, 100)}%`,
                          backgroundColor: statusColor(item.status),
                        },
                      ]}
                    />
                  </View>
                  <Text variant="caption" color={colors.textTertiary}>
                    {Math.round(item.consumed * 10) / 10}{item.unit}
                    {item.rda !== null ? ` / ${item.rda}${item.unit}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}

      {micronutrients.length === 0 && (
        <Card>
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>
              Log foods with nutrient data to see micronutrient tracking.
            </Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function MacroRing({
  label,
  consumed,
  goal,
  pct,
  color,
  unit = '',
}: {
  label: string;
  consumed: number;
  goal: number;
  pct: number;
  color: string;
  unit?: string;
}) {
  const clampedPct = Math.min(pct, 100);
  const ringSize = 72;

  return (
    <View style={styles.ringItem}>
      <View style={[styles.ringOuter, { width: ringSize, height: ringSize }]}>
        {/* Background ring */}
        <View
          style={[
            styles.ringBg,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: colors.border,
            },
          ]}
        />
        {/* Progress indicator (simplified as filled arc approximation) */}
        <View
          style={[
            styles.ringProgress,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: color,
              borderTopColor: clampedPct > 25 ? color : 'transparent',
              borderRightColor: clampedPct > 50 ? color : 'transparent',
              borderBottomColor: clampedPct > 75 ? color : 'transparent',
              borderLeftColor: clampedPct > 0 ? color : 'transparent',
            },
          ]}
        />
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPct, { color }]}>{pct}%</Text>
        </View>
      </View>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="caption" color={colors.textTertiary}>
        {Math.round(consumed)}{unit} / {Math.round(goal)}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  ringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  ringItem: { alignItems: 'center', flex: 1, gap: 4 },
  ringOuter: { justifyContent: 'center', alignItems: 'center' },
  ringBg: {
    position: 'absolute',
    borderWidth: 5,
  },
  ringProgress: {
    position: 'absolute',
    borderWidth: 5,
    transform: [{ rotate: '-90deg' }],
  },
  ringCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPct: { fontSize: 14, fontWeight: '700' },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
  nutrientGrid: { marginTop: spacing.sm, gap: spacing.sm },
  nutrientItem: { gap: 2 },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientName: { color: colors.text, flex: 1 },
  rdaBarOuter: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rdaBarInner: {
    height: '100%',
    borderRadius: 3,
  },
});
