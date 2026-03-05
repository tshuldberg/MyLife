import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  getActiveMedications,
  getMedications,
  deleteMedication,
  createMedicationExtended,
  checkInteractions,
  getDaysRemaining,
  type Medication,
  type MedFrequency,
} from '@mylife/meds';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const FREQUENCIES: MedFrequency[] = ['daily', 'twice_daily', 'weekly', 'as_needed', 'custom'];

export default function MedicationsScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedFrequency>('daily');
  const [pillCount, setPillCount] = useState('');

  const medications = useMemo(() => getMedications(db), [db, tick]);

  const handleAdd = () => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const activeMeds = getActiveMedications(db);
    const activeMedNames = activeMeds.map((m) => m.name);
    const warnings = checkInteractions(db, cleanName, activeMedNames);

    const doCreate = () => {
      createMedicationExtended(db, uuid(), {
        name: cleanName,
        dosage: dosage.trim() || undefined,
        frequency,
        pillCount: pillCount ? Number(pillCount) : undefined,
      });
      setName('');
      setDosage('');
      setFrequency('daily');
      setPillCount('');
      refresh();
    };

    if (warnings.length > 0) {
      const msg = warnings
        .map((w) => `${w.drug} (${w.severity}): ${w.description}`)
        .join('\n');
      Alert.alert('Interaction Warning', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Anyway', onPress: doCreate },
      ]);
    } else {
      doCreate();
    }
  };

  const handleDelete = (med: Medication) => {
    Alert.alert('Delete Medication', `Remove ${med.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMedication(db, med.id);
          refresh();
        },
      },
    ]);
  };

  const listHeader = (
    <View style={styles.content}>
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
          <TextInput
            style={styles.input}
            value={pillCount}
            onChangeText={setPillCount}
            placeholder="Pill count (optional)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
          <View style={styles.row}>
            {FREQUENCIES.map((f) => {
              const selected = f === frequency;
              return (
                <Pressable
                  key={f}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setFrequency(f)}
                >
                  <Text
                    variant="caption"
                    color={selected ? colors.background : colors.textSecondary}
                  >
                    {f.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.primaryButton} onPress={handleAdd}>
            <Text variant="label" color={colors.background}>Add Medication</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">All Medications</Text>
      </Card>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.listContent}
      data={medications}
      keyExtractor={(item: Medication) => item.id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      ListHeaderComponent={listHeader}
      renderItem={({ item }) => {
        const daysLeft = getDaysRemaining(db, item.id);
        return (
          <View style={styles.listItemPadding}>
            <Card style={styles.innerCard}>
              <View style={styles.rowBetween}>
                <View style={styles.mainCopy}>
                  <Text variant="body">{item.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.dosage ?? 'dose n/a'} · {item.frequency.replace('_', ' ')}
                    {item.pillCount != null ? ` · ${item.pillCount} pills` : ''}
                    {daysLeft != null && daysLeft !== Infinity ? ` · ${daysLeft}d left` : ''}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: item.isActive ? ACCENT : colors.textTertiary },
                    ]}
                  >
                    <Text variant="caption" color={colors.background}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Pressable style={styles.dangerButton} onPress={() => handleDelete(item)}>
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text variant="body" color={colors.textSecondary}>No medications yet.</Text>
        </View>
      }
    />
  );
}

const ACCENT = colors.modules.meds;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  listContent: { paddingBottom: spacing.xxl },
  listItemPadding: { paddingHorizontal: spacing.md },
  formGrid: { marginTop: spacing.sm, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
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
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
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
  badge: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
