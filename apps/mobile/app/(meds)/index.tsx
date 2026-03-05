import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  countMedications,
  getActiveMedications,
  getDoseLogsForDate,
  logDose,
  undoDoseLog,
  getLowSupplyAlerts,
  getAdherenceRateV2,
  type DoseLog,
  type LowSupplyAlert,
  type Medication,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

function dateMinusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const today = new Date().toISOString().slice(0, 10);
  const medications = useMemo(() => getActiveMedications(db), [db, tick]);
  const doseLogs = useMemo(() => getDoseLogsForDate(db, today), [db, today, tick]);
  const lowSupply = useMemo(() => getLowSupplyAlerts(db), [db, tick]);
  const totalCount = useMemo(() => countMedications(db), [db, tick]);
  const takenToday = useMemo(
    () => doseLogs.filter((d) => d.status === 'taken' || d.status === 'late').length,
    [doseLogs],
  );
  const overallAdherence = useMemo(() => {
    if (medications.length === 0) return 0;
    const from = dateMinusDays(30);
    const rates = medications.map((m) => getAdherenceRateV2(db, m.id, from, today));
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [db, medications, today, tick]);

  const dosesByMedId = useMemo(() => {
    const map = new Map<string, DoseLog[]>();
    for (const dl of doseLogs) {
      const list = map.get(dl.medicationId) ?? [];
      list.push(dl);
      map.set(dl.medicationId, list);
    }
    return map;
  }, [doseLogs]);

  const handleTake = (med: Medication) => {
    logDose(db, uuid(), {
      medicationId: med.id,
      scheduledTime: new Date().toISOString(),
      actualTime: new Date().toISOString(),
      status: 'taken',
    });
    refresh();
  };

  const handleSkip = (med: Medication) => {
    logDose(db, uuid(), {
      medicationId: med.id,
      scheduledTime: new Date().toISOString(),
      status: 'skipped',
    });
    refresh();
  };

  const handleUndo = (doseId: string) => {
    undoDoseLog(db, doseId);
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Medications" value={String(totalCount)} />
        <Metric label="Taken Today" value={String(takenToday)} />
        <Metric label="Adherence" value={`${overallAdherence}%`} />
      </View>

      {lowSupply.length > 0 && (
        <Card>
          <Text variant="subheading">Refill Alerts</Text>
          {lowSupply.map((alert: LowSupplyAlert) => (
            <View key={alert.medicationId} style={styles.alertRow}>
              <Text variant="body" color={colors.danger}>
                {alert.name}: {alert.pillCount} pills left ({alert.daysRemaining}d supply)
              </Text>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text variant="subheading">Today's Schedule</Text>
        <View style={styles.list}>
          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>No active medications.</Text>
            </View>
          ) : (
            medications.map((item) => {
              const medDoses = dosesByMedId.get(item.id) ?? [];
              const taken = medDoses.find((d) => d.status === 'taken' || d.status === 'late');
              const skipped = !taken && medDoses.find((d) => d.status === 'skipped');

              return (
                <Card key={item.id} style={styles.innerCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.mainCopy}>
                      <Text variant="body">{item.name}</Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {item.dosage ?? 'dose n/a'} · {item.frequency.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      {!taken && !skipped ? (
                        <>
                          <Pressable style={styles.primaryButton} onPress={() => handleTake(item)}>
                            <Text variant="label" color={colors.background}>Take</Text>
                          </Pressable>
                          <Pressable style={styles.secondaryButton} onPress={() => handleSkip(item)}>
                            <Text variant="label">Skip</Text>
                          </Pressable>
                        </>
                      ) : (
                        <View style={styles.statusRow}>
                          <Text
                            variant="label"
                            color={taken ? ACCENT : colors.textTertiary}
                          >
                            {taken ? 'Taken' : 'Skipped'}
                          </Text>
                          <Pressable
                            onPress={() => {
                              const dose = taken || skipped;
                              if (dose) handleUndo(dose.id);
                            }}
                          >
                            <Text variant="caption" color={colors.textSecondary}>Undo</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const ACCENT = colors.modules.meds;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '31.5%', minWidth: 95, gap: spacing.xs },
  metricValue: { color: colors.modules.meds, fontSize: 20, fontWeight: '700' },
  list: { marginTop: spacing.sm },
  innerCard: { marginBottom: spacing.sm, backgroundColor: colors.surfaceElevated },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainCopy: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusRow: { alignItems: 'center', gap: 2 },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.meds,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  alertRow: { marginTop: spacing.xs },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
