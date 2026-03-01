import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  logPeriod,
  updatePeriod,
  deletePeriod,
  getPeriods,
  getPeriodsInRange,
  PREDEFINED_SYMPTOMS,
  logSymptom,
  getSymptoms,
  deleteSymptom,
  predictNextPeriod,
  getLatestPrediction,
  type CyclePeriod,
} from '@mylife/habits';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CycleScreen() {
  const db = useDatabase();

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  // Period form
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState('');

  // Symptom form
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [symptomPeriodId, setSymptomPeriodId] = useState<string | null>(null);
  const [symptomDate, setSymptomDate] = useState(todayString());
  const [symptomType, setSymptomType] = useState<string>(PREDEFINED_SYMPTOMS[0]);
  const [symptomSeverity, setSymptomSeverity] = useState(3);

  // Calendar month
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const periods = useMemo(() => getPeriods(db), [db, tick]);
  const prediction = useMemo(() => getLatestPrediction(db), [db, tick]);

  // Calendar data for current month
  const calendarPeriods = useMemo(() => {
    const { year, month } = calendarMonth;
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return getPeriodsInRange(db, from, to);
  }, [db, calendarMonth, tick]);

  // Compute period dates set for calendar coloring
  const periodDates = useMemo(() => {
    const set = new Set<string>();
    for (const p of calendarPeriods) {
      let d = p.startDate;
      const end = p.endDate ?? p.startDate;
      while (d <= end) {
        set.add(d);
        d = dateAddDays(d, 1);
      }
    }
    return set;
  }, [calendarPeriods]);

  // Prediction dates for calendar
  const predictionDates = useMemo(() => {
    const set = new Set<string>();
    if (prediction) {
      let d = prediction.predictedStart;
      while (d <= prediction.predictedEnd) {
        set.add(d);
        d = dateAddDays(d, 1);
      }
    }
    return set;
  }, [prediction]);

  // Cycle stats
  const cycleStats = useMemo(() => {
    if (periods.length < 2) return null;
    const lengths: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const curr = new Date(periods[i].startDate + 'T00:00:00Z');
      const next = new Date(periods[i + 1].startDate + 'T00:00:00Z');
      const days = Math.round((curr.getTime() - next.getTime()) / 86400000);
      if (days > 0) lengths.push(days);
    }
    if (lengths.length === 0) return null;
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, v) => sum + (v - avg) ** 2, 0) / lengths.length;
    return {
      averageLength: Math.round(avg * 10) / 10,
      variation: Math.round(Math.sqrt(variance) * 10) / 10,
      totalCycles: lengths.length,
      shortest: Math.min(...lengths),
      longest: Math.max(...lengths),
    };
  }, [periods]);

  const handleAddPeriod = () => {
    if (!startDate) return;
    logPeriod(db, uuid(), {
      startDate,
      endDate: endDate || undefined,
    });
    setShowAddPeriod(false);
    setStartDate(todayString());
    setEndDate('');
    refresh();
  };

  const handleDeletePeriod = (period: CyclePeriod) => {
    Alert.alert('Delete Period', `Delete period starting ${formatDate(period.startDate)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePeriod(db, period.id); refresh(); } },
    ]);
  };

  const handleEndPeriod = (period: CyclePeriod) => {
    updatePeriod(db, period.id, { endDate: todayString() });
    refresh();
  };

  const handleRunPrediction = () => {
    const result = predictNextPeriod(db);
    if (!result) {
      Alert.alert('Not enough data', 'Need at least 2 completed periods to predict.');
    }
    refresh();
  };

  const handleAddSymptom = () => {
    if (!symptomPeriodId) return;
    logSymptom(db, uuid(), {
      periodId: symptomPeriodId,
      date: symptomDate,
      symptomType,
      severity: symptomSeverity,
    });
    setShowSymptomForm(false);
    refresh();
  };

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.privacyBadge}>
        <Text variant="caption" color={colors.modules.habits}>
          All data stored on this device only
        </Text>
      </Card>

      {/* Calendar */}
      <Card>
        <View style={styles.calendarHeader}>
          <Pressable onPress={prevMonth}>
            <Text variant="label" color={colors.modules.habits}>{'\u25C0'}</Text>
          </Pressable>
          <Text variant="subheading">
            {MONTHS[calendarMonth.month]} {calendarMonth.year}
          </Text>
          <Pressable onPress={nextMonth}>
            <Text variant="label" color={colors.modules.habits}>{'\u25B6'}</Text>
          </Pressable>
        </View>
        <CalendarGrid
          year={calendarMonth.year}
          month={calendarMonth.month}
          periodDates={periodDates}
          predictionDates={predictionDates}
        />
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
            <Text variant="caption" color={colors.textTertiary}>Period</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(139, 92, 246, 0.4)' }]} />
            <Text variant="caption" color={colors.textTertiary}>Predicted</Text>
          </View>
        </View>
      </Card>

      {/* Log Period */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="subheading">Periods</Text>
          <Pressable style={styles.smallButton} onPress={() => setShowAddPeriod(!showAddPeriod)}>
            <Text variant="label" color={colors.background}>
              {showAddPeriod ? 'Cancel' : '+ Log Period'}
            </Text>
          </Pressable>
        </View>

        {showAddPeriod && (
          <View style={styles.form}>
            <View style={styles.formRow}>
              <Text variant="body" color={colors.textSecondary}>Start:</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.formRow}>
              <Text variant="body" color={colors.textSecondary}>End:</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Pressable style={styles.saveBtn} onPress={handleAddPeriod}>
              <Text variant="label" color={colors.background}>Save Period</Text>
            </Pressable>
          </View>
        )}

        {periods.length === 0 ? (
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            No periods logged yet.
          </Text>
        ) : (
          <View style={styles.periodList}>
            {periods.slice(0, 10).map((p) => (
              <View key={p.id} style={styles.periodRow}>
                <View style={styles.periodInfo}>
                  <Text variant="body" color={colors.text}>
                    {formatDate(p.startDate)}
                    {p.endDate ? ` - ${formatDate(p.endDate)}` : ' (ongoing)'}
                  </Text>
                  {p.cycleLength && (
                    <Text variant="caption" color={colors.textTertiary}>
                      Cycle: {p.cycleLength} days
                    </Text>
                  )}
                </View>
                <View style={styles.periodActions}>
                  {!p.endDate && (
                    <Pressable
                      style={styles.tinyButton}
                      onPress={() => handleEndPeriod(p)}
                    >
                      <Text variant="caption" color={colors.modules.habits}>End</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.tinyButton}
                    onPress={() => {
                      setSymptomPeriodId(p.id);
                      setShowSymptomForm(true);
                    }}
                  >
                    <Text variant="caption" color={colors.modules.habits}>+Symptom</Text>
                  </Pressable>
                  <Pressable
                    style={styles.tinyButton}
                    onPress={() => handleDeletePeriod(p)}
                  >
                    <Text variant="caption" color={colors.danger}>Del</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Symptom Logger */}
      {showSymptomForm && symptomPeriodId && (
        <Card>
          <Text variant="subheading">Log Symptom</Text>
          <View style={styles.form}>
            <View style={styles.formRow}>
              <Text variant="body" color={colors.textSecondary}>Date:</Text>
              <TextInput
                style={styles.dateInput}
                value={symptomDate}
                onChangeText={setSymptomDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text variant="body" color={colors.textSecondary}>Symptom:</Text>
            <View style={styles.chipRow}>
              {PREDEFINED_SYMPTOMS.map((s) => {
                const selected = s === symptomType;
                const label = s.replace(/_/g, ' ');
                return (
                  <Pressable
                    key={s}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                    onPress={() => setSymptomType(s)}
                  >
                    <Text
                      variant="caption"
                      color={selected ? colors.background : colors.textSecondary}
                      style={{ fontSize: 11 }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.formRow}>
              <Text variant="body" color={colors.textSecondary}>Severity (1-5):</Text>
              <View style={styles.severityRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    style={[styles.severityBtn, n === symptomSeverity ? styles.severitySelected : null]}
                    onPress={() => setSymptomSeverity(n)}
                  >
                    <Text
                      variant="label"
                      color={n === symptomSeverity ? colors.background : colors.textSecondary}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.formActions}>
              <Pressable style={styles.saveBtn} onPress={handleAddSymptom}>
                <Text variant="label" color={colors.background}>Save Symptom</Text>
              </Pressable>
              <Pressable style={styles.cancelFormBtn} onPress={() => setShowSymptomForm(false)}>
                <Text variant="label" color={colors.textSecondary}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      )}

      {/* Symptoms for recent period */}
      {periods.length > 0 && (
        <PeriodSymptoms db={db} period={periods[0]} tick={tick} />
      )}

      {/* Prediction */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text variant="subheading">Prediction</Text>
          <Pressable style={styles.smallButton} onPress={handleRunPrediction}>
            <Text variant="label" color={colors.background}>Predict</Text>
          </Pressable>
        </View>
        {prediction ? (
          <View style={styles.predictionInfo}>
            <Text variant="body" color={colors.text}>
              Next period: {formatDate(prediction.predictedStart)} - {formatDate(prediction.predictedEnd)}
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              Confidence: +/- {prediction.confidenceDays} days
            </Text>
          </View>
        ) : (
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            Log at least 2 completed periods to see predictions.
          </Text>
        )}
      </Card>

      {/* Cycle Stats */}
      {cycleStats && (
        <Card>
          <Text variant="subheading">Cycle Statistics</Text>
          <View style={styles.statsGrid}>
            <CycleStat label="Avg Length" value={`${cycleStats.averageLength}d`} />
            <CycleStat label="Variation" value={`+/-${cycleStats.variation}d`} />
            <CycleStat label="Cycles Tracked" value={String(cycleStats.totalCycles)} />
            <CycleStat label="Shortest" value={`${cycleStats.shortest}d`} />
            <CycleStat label="Longest" value={`${cycleStats.longest}d`} />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function PeriodSymptoms({
  db,
  period,
  tick,
}: {
  db: ReturnType<typeof useDatabase>;
  period: CyclePeriod;
  tick: number;
}) {
  const symptoms = useMemo(() => getSymptoms(db, period.id), [db, period.id, tick]);

  if (symptoms.length === 0) return null;

  return (
    <Card>
      <Text variant="subheading">Symptoms (current period)</Text>
      <View style={styles.symptomList}>
        {symptoms.map((s) => (
          <View key={s.id} style={styles.symptomRow}>
            <View style={styles.symptomInfo}>
              <Text variant="body" color={colors.text}>
                {s.symptomType.replace(/_/g, ' ')}
              </Text>
              <Text variant="caption" color={colors.textTertiary}>
                {formatDate(s.date)} / severity {s.severity}/5
              </Text>
            </View>
            <Pressable onPress={() => { deleteSymptom(db, s.id); }}>
              <Text variant="caption" color={colors.danger}>x</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </Card>
  );
}

function CalendarGrid({
  year,
  month,
  periodDates,
  predictionDates,
}: {
  year: number;
  month: number;
  periodDates: Set<string>;
  predictionDates: Set<string>;
}) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayString();

  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={styles.calendarGrid}>
      <View style={styles.calendarRow}>
        {dayHeaders.map((d) => (
          <View key={d} style={styles.calendarDayHeader}>
            <Text variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={styles.calendarDays}>
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`empty-${i}`} style={styles.calendarCell} />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPeriod = periodDates.has(dateStr);
          const isPrediction = predictionDates.has(dateStr);
          const isToday = dateStr === today;

          let bg = 'transparent';
          if (isPeriod) bg = '#DC2626';
          else if (isPrediction) bg = 'rgba(139, 92, 246, 0.4)';

          return (
            <View
              key={dateStr}
              style={[
                styles.calendarCell,
                { backgroundColor: bg },
                isToday ? styles.calendarToday : null,
              ]}
            >
              <Text
                variant="caption"
                color={isPeriod ? colors.text : isToday ? colors.modules.habits : colors.textSecondary}
                style={{ fontSize: 12 }}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CycleStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cycleStat}>
      <Text style={styles.cycleStatValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  privacyBadge: {
    alignItems: 'center', paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.modules.habits,
  },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  calendarGrid: { gap: 2 },
  calendarRow: { flexDirection: 'row' },
  calendarDayHeader: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  calendarDays: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', borderRadius: 4,
  },
  calendarToday: { borderWidth: 1, borderColor: colors.modules.habits },
  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  smallButton: {
    borderRadius: 6, backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  form: { marginTop: spacing.sm, gap: spacing.sm },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    color: colors.text, backgroundColor: colors.surfaceElevated,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999,
    paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.modules.habits, backgroundColor: colors.modules.habits },
  severityRow: { flexDirection: 'row', gap: spacing.xs },
  severityBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  severitySelected: { backgroundColor: colors.modules.habits, borderColor: colors.modules.habits },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: {
    borderRadius: 8, backgroundColor: colors.modules.habits,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  cancelFormBtn: {
    borderRadius: 8, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  periodList: { marginTop: spacing.sm, gap: spacing.sm },
  periodRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  periodInfo: { flex: 1, gap: 2 },
  periodActions: { flexDirection: 'row', gap: spacing.xs },
  tinyButton: {
    paddingHorizontal: spacing.xs, paddingVertical: 4,
    borderRadius: 4, borderWidth: 1, borderColor: colors.border,
  },
  predictionInfo: { marginTop: spacing.sm, gap: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  cycleStat: { flex: 1, minWidth: 80, alignItems: 'center', gap: 2 },
  cycleStatValue: { color: colors.modules.habits, fontSize: 20, fontWeight: '700' },
  symptomList: { marginTop: spacing.sm, gap: spacing.xs },
  symptomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  symptomInfo: { flex: 1, gap: 2 },
});
