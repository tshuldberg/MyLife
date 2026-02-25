import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  countVehicles,
  createFuelLog,
  createMaintenance,
  createVehicle,
  deleteFuelLog,
  deleteMaintenance,
  deleteVehicle,
  getFuelLogsByVehicle,
  getMaintenanceByVehicle,
  getVehicles,
  type FuelLog,
  type Maintenance,
  type Vehicle,
} from '@mylife/car';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

function formatCurrency(cents: number | null | undefined): string {
  return `$${(((cents ?? 0) as number) / 100).toFixed(2)}`;
}

export default function CarScreen() {
  const db = useDatabase();

  const [vehicleName, setVehicleName] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState(String(new Date().getFullYear()));

  const [maintenanceType, setMaintenanceType] = useState('oil_change');
  const [maintenanceCost, setMaintenanceCost] = useState('0');
  const [maintenanceOdometer, setMaintenanceOdometer] = useState('0');

  const [fuelGallons, setFuelGallons] = useState('10');
  const [fuelCost, setFuelCost] = useState('0');
  const [fuelOdometer, setFuelOdometer] = useState('0');

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const vehicles = useMemo(() => getVehicles(db), [db, tick]);
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0] ?? null,
    [selectedVehicleId, vehicles],
  );
  const maintenance = useMemo(
    () => (selectedVehicle ? getMaintenanceByVehicle(db, selectedVehicle.id) : []),
    [db, selectedVehicle, tick],
  );
  const fuelLogs = useMemo(
    () => (selectedVehicle ? getFuelLogsByVehicle(db, selectedVehicle.id) : []),
    [db, selectedVehicle, tick],
  );

  const addVehicle = () => {
    createVehicle(db, uuid(), {
      name: vehicleName.trim() || `${vehicleMake.trim()} ${vehicleModel.trim()}`.trim() || 'Vehicle',
      make: vehicleMake.trim() || 'Make',
      model: vehicleModel.trim() || 'Model',
      year: Math.max(1900, Number(vehicleYear) || new Date().getFullYear()),
      odometer: 0,
      fuelType: 'gas',
    });
    setVehicleName('');
    setVehicleMake('');
    setVehicleModel('');
    refresh();
  };

  const addMaintenance = () => {
    if (!selectedVehicle) return;
    createMaintenance(db, uuid(), selectedVehicle.id, {
      type: maintenanceType,
      performedAt: new Date().toISOString(),
      costCents: Math.max(0, Math.round((Number(maintenanceCost) || 0) * 100)),
      odometerAt: Math.max(0, Number(maintenanceOdometer) || 0),
    });
    setMaintenanceCost('0');
    refresh();
  };

  const addFuelLog = () => {
    if (!selectedVehicle) return;
    createFuelLog(db, uuid(), selectedVehicle.id, {
      gallons: Math.max(0, Number(fuelGallons) || 0),
      costCents: Math.max(0, Math.round((Number(fuelCost) || 0) * 100)),
      odometerAt: Math.max(0, Number(fuelOdometer) || 0),
      loggedAt: new Date().toISOString(),
      isFullTank: true,
    });
    setFuelCost('0');
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.metricsGrid}>
        <Metric label="Vehicles" value={String(countVehicles(db))} />
        <Metric label="Maintenance" value={String(maintenance.length)} />
        <Metric label="Fuel Logs" value={String(fuelLogs.length)} />
      </View>

      <Card>
        <Text variant="subheading">Add Vehicle</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={setVehicleName}
            placeholder="Nickname"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={vehicleMake}
              onChangeText={setVehicleMake}
              placeholder="Make"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={vehicleModel}
              onChangeText={setVehicleModel}
              placeholder="Model"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={vehicleYear}
              onChangeText={setVehicleYear}
              placeholder="Year"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          <Pressable style={styles.primaryButton} onPress={addVehicle}>
            <Text variant="label" color={colors.background}>Save Vehicle</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Vehicles</Text>
        <FlatList
          data={vehicles}
          keyExtractor={(item: Vehicle) => item.id}
          scrollEnabled={false}
          style={styles.list}
          renderItem={({ item }) => {
            const selected = selectedVehicle?.id === item.id;
            return (
              <Card style={[styles.innerCard, selected ? styles.innerCardSelected : null]}>
                <View style={styles.rowBetween}>
                  <Pressable style={styles.mainCopy} onPress={() => setSelectedVehicleId(item.id)}>
                    <Text variant="body">{item.name}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {item.year} {item.make} {item.model} · {item.odometer} mi
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteVehicle(db, item.id);
                      if (selectedVehicle?.id === item.id) setSelectedVehicleId(null);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>No vehicles yet.</Text>
            </View>
          }
        />
      </Card>

      {selectedVehicle ? (
        <>
          <Card>
            <Text variant="subheading">Maintenance · {selectedVehicle.name}</Text>
            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                value={maintenanceType}
                onChangeText={setMaintenanceType}
                placeholder="Type"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={maintenanceCost}
                  onChangeText={setMaintenanceCost}
                  placeholder="Cost"
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

            <FlatList
              data={maintenance}
              keyExtractor={(item: Maintenance) => item.id}
              scrollEnabled={false}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{item.type}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {new Date(item.performedAt).toLocaleDateString()} · {formatCurrency(item.costCents)}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteMaintenance(db, item.id);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <Text variant="caption" color={colors.textSecondary}>No maintenance records yet.</Text>
              }
            />
          </Card>

          <Card>
            <Text variant="subheading">Fuel Logs · {selectedVehicle.name}</Text>
            <View style={styles.formGrid}>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={fuelGallons}
                  onChangeText={setFuelGallons}
                  placeholder="Gallons"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  value={fuelCost}
                  onChangeText={setFuelCost}
                  placeholder="Cost"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  value={fuelOdometer}
                  onChangeText={setFuelOdometer}
                  placeholder="Odometer"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <Pressable style={styles.primaryButton} onPress={addFuelLog}>
                <Text variant="label" color={colors.background}>Add Fuel Log</Text>
              </Pressable>
            </View>

            <FlatList
              data={fuelLogs}
              keyExtractor={(item: FuelLog) => item.id}
              scrollEnabled={false}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{item.gallons.toFixed(1)} gal</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {new Date(item.loggedAt).toLocaleDateString()} · {formatCurrency(item.costCents)} · {item.odometerAt} mi
                    </Text>
                  </View>
                  <Pressable
                    style={styles.dangerButton}
                    onPress={() => {
                      deleteFuelLog(db, item.id);
                      refresh();
                    }}
                  >
                    <Text variant="label" color={colors.background}>Delete</Text>
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <Text variant="caption" color={colors.textSecondary}>No fuel logs yet.</Text>
              }
            />
          </Card>
        </>
      ) : null}
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
    color: colors.modules.car,
    fontSize: 20,
    fontWeight: '700',
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
  list: {
    marginTop: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  innerCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  innerCardSelected: {
    borderColor: colors.modules.car,
    borderWidth: 2,
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
