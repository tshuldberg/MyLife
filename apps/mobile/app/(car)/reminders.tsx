import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  createMaintenance,
  deleteMaintenance,
  getMaintenanceByVehicle,
  getVehicles,
  type Maintenance,
  type Vehicle,
} from '@mylife/car';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

function formatCurrency(cents: number | null | undefined): string {
  return `$${(((cents ?? 0) as number) / 100).toFixed(2)}`;
}

export default function RemindersScreen() {
  const db = useDatabase();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [maintenanceType, setMaintenanceType] = useState('oil_change');
  const [maintenanceCost, setMaintenanceCost] = useState('0');
  const [maintenanceOdometer, setMaintenanceOdometer] = useState('0');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const vehicles = useMemo(() => getVehicles(db), [db, tick]);
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0] ?? null,
    [selectedVehicleId, vehicles],
  );
  const maintenance = useMemo(
    () => (selectedVehicle ? getMaintenanceByVehicle(db, selectedVehicle.id) : []),
    [db, selectedVehicle, tick],
  );

  const addMaintenance = () => {
    if (!selectedVehicle) {
      Alert.alert('No vehicle', 'Add a vehicle in the Garage tab first.');
      return;
    }
    createMaintenance(db, uuid(), selectedVehicle.id, {
      type: maintenanceType.trim() || 'oil_change',
      performedAt: new Date().toISOString(),
      costCents: Math.max(0, Math.round((Number(maintenanceCost) || 0) * 100)),
      odometerAt: Math.max(0, Number(maintenanceOdometer) || 0),
    });
    setMaintenanceCost('0');
    setMaintenanceNotes('');
    refresh();
  };

  const handleDelete = (item: Maintenance) => {
    Alert.alert('Delete record?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMaintenance(db, item.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="heading">Reminders</Text>
      <Text variant="caption" color={colors.textSecondary}>
        Track upcoming maintenance by service type and mileage.
      </Text>

      {vehicles.length === 0 ? (
        <Card>
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>
              Add a vehicle in the Garage tab first.
            </Text>
          </View>
        </Card>
      ) : (
        <>
          <Card>
            <Text variant="subheading">Vehicle</Text>
            <View style={styles.chipRow}>
              {vehicles.map((vehicle) => {
                const selected = (selectedVehicle?.id ?? '') === vehicle.id;
                return (
                  <Pressable
                    key={vehicle.id}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                    onPress={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <Text variant="label" color={selected ? colors.background : colors.text}>
                      {vehicle.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text variant="subheading">Add Maintenance</Text>
            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                value={maintenanceType}
                onChangeText={setMaintenanceType}
                placeholder="Service type (e.g. oil_change)"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={maintenanceCost}
                  onChangeText={setMaintenanceCost}
                  placeholder="Cost ($)"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  value={maintenanceOdometer}
                  onChangeText={setMaintenanceOdometer}
                  placeholder="Odometer"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <Pressable style={styles.primaryButton} onPress={addMaintenance}>
                <Text variant="label" color={colors.background}>Add Maintenance</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text variant="subheading">
              Maintenance Log · {selectedVehicle?.name ?? 'None'}
            </Text>
            {maintenance.length === 0 ? (
              <Text variant="caption" color={colors.textSecondary}>
                No maintenance records yet.
              </Text>
            ) : (
              maintenance.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemCopy}>
                    <Text variant="body">{item.type}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {new Date(item.performedAt).toLocaleDateString()} · {formatCurrency(item.costCents)}
                      {item.odometerAt ? ` · ${item.odometerAt.toLocaleString()} mi` : ''}
                    </Text>
                    {item.notes ? (
                      <Text variant="caption" color={colors.textSecondary}>{item.notes}</Text>
                    ) : null}
                  </View>
                  <Pressable style={styles.dangerButton} onPress={() => handleDelete(item)}>
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
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
  formGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    minWidth: 100,
    flex: 1,
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
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.modules.car,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.car,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
