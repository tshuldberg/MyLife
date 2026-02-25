import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  countMedications,
  createMedication,
  deleteMedication,
  deleteDose,
  getAdherenceRate,
  getDosesForDate,
  getMedications,
  recordDose,
  type Dose,
  type MedFrequency,
  type Medication,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const FREQUENCIES: MedFrequency[] = [
  'daily',
  'twice_daily',
  'weekly',
  'as_needed',
  'custom',
];

function dateMinusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function MedsScreen() {
  const db = useDatabase();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedFrequency>('daily');

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const medications = useMemo(() => getMedications(db, { isActive: true }), [db, tick]);
  const today = new Date().toISOString().slice(0, 10);
  const doses = useMemo(() => getDosesForDate(db, today), [db, today, tick]);

  const dosesByMedicationId = useMemo(() => {
    const map = new Map<string, Dose[]>();
    for (const dose of doses) {
      const list = map.get(dose.medicationId) ?? [];
      list.push(dose);
      map.set(dose.medicationId, list);
    }
    return map;
  }, [doses]);

  const addMedication = () => {
    const clean = name.trim();
    if (!clean) return;
    createMedication(db, uuid(), {
      name: clean,
      dosage: dosage.trim() || undefined,
      unit: undefined,
      frequency,
    });
    setName('');
    setDosage('');
    setFrequency('daily');
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Medications" value={String(countMedications(db))} />
        <Metric label="Taken Today" value={String(doses.filter((dose) => !dose.skipped).length)} />
        <Metric label="Total Logs" value={String(doses.length)} />
      </View>

      <Card>
        <Text variant="subheading">Add Medication</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Medication name"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="Dosage (e.g. 10mg)"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.row}>
            {FREQUENCIES.map((value) => {
              const selected = value === frequency;
              return (
                <Pressable
                  key={value}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => setFrequency(value)}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {value.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.primaryButton} onPress={addMedication}>
            <Text variant="label" color={colors.background}>Create</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Today Schedule</Text>
        <FlatList
          data={medications}
          keyExtractor={(item: Medication) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => {
            const todayDoses = dosesByMedicationId.get(item.id) ?? [];
            const taken = todayDoses.find((dose) => !dose.skipped);
            const skipped = !taken && todayDoses.find((dose) => dose.skipped);
            const adherence = getAdherenceRate(db, item.id, dateMinusDays(30), today);

            return (
              <Card style={styles.innerCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{item.name}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {item.dosage ?? 'dose n/a'} · {item.frequency.replace('_', ' ')} · {adherence}% adherence
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    {!taken && !skipped ? (
                      <>
                        <Pressable
                          style={styles.primaryButton}
                          onPress={() => {
                            recordDose(db, uuid(), item.id, new Date().toISOString(), false);
                            refresh();
                          }}
                        >
                          <Text variant="label" color={colors.background}>Take</Text>
                        </Pressable>
                        <Pressable
                          style={styles.secondaryButton}
                          onPress={() => {
                            recordDose(db, uuid(), item.id, new Date().toISOString(), true);
                            refresh();
                          }}
                        >
                          <Text variant="label">Skip</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text
                        variant="label"
                        color={taken ? colors.modules.meds : colors.textTertiary}
                      >
                        {taken ? 'Taken' : 'Skipped'}
                      </Text>
                    )}
                    <Pressable
                      style={styles.dangerButton}
                      onPress={() => {
                        deleteMedication(db, item.id);
                        refresh();
                      }}
                    >
                      <Text variant="label" color={colors.background}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
                {todayDoses.length > 0 ? (
                  <View style={styles.logRow}>
                    {todayDoses.map((dose) => (
                      <Pressable
                        key={dose.id}
                        style={styles.logChip}
                        onPress={() => {
                          deleteDose(db, dose.id);
                          refresh();
                        }}
                      >
                        <Text variant="caption" color={colors.textSecondary}>
                          {dose.skipped ? 'Skipped' : 'Taken'} {new Date(dose.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>No medications yet.</Text>
            </View>
          }
        />
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '31.5%',
    minWidth: 95,
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.modules.meds,
    fontSize: 20,
    fontWeight: '700',
  },
  formGrid: {
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
  row: {
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
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.modules.meds,
    backgroundColor: colors.modules.meds,
  },
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
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  list: {
    marginTop: spacing.sm,
  },
  innerCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  logRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  logChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
