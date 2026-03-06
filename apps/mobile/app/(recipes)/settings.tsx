import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getSetting, setSetting } from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.recipes;

export default function RecipesSettingsScreen() {
  const db = useDatabase();

  const [defaultServings, setDefaultServings] = useState('4');
  const [measurementSystem, setMeasurementSystem] = useState('us');

  const load = useCallback(() => {
    setDefaultServings(getSetting(db, 'defaultServings') ?? '4');
    setMeasurementSystem(getSetting(db, 'measurementSystem') ?? 'us');
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const handleServings = () => {
    Alert.alert('Default Servings', 'Choose default serving count', [
      { text: '2', onPress: () => { setSetting(db, 'defaultServings', '2'); load(); } },
      { text: '4', onPress: () => { setSetting(db, 'defaultServings', '4'); load(); } },
      { text: '6', onPress: () => { setSetting(db, 'defaultServings', '6'); load(); } },
      { text: '8', onPress: () => { setSetting(db, 'defaultServings', '8'); load(); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMeasurement = () => {
    Alert.alert('Measurement System', undefined, [
      { text: 'US (cups, oz, lb)', onPress: () => { setSetting(db, 'measurementSystem', 'us'); load(); } },
      { text: 'Metric (ml, g, kg)', onPress: () => { setSetting(db, 'measurementSystem', 'metric'); load(); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text variant="caption" color={colors.textSecondary} style={styles.sectionHeader}>
        DEFAULTS
      </Text>
      <Card>
        <Pressable style={styles.settingsRow} onPress={handleServings}>
          <Text variant="body">Default Servings</Text>
          <Text variant="body" color={ACCENT}>{defaultServings}</Text>
        </Pressable>
        <View style={styles.separator} />
        <Pressable style={styles.settingsRow} onPress={handleMeasurement}>
          <Text variant="body">Measurement System</Text>
          <Text variant="body" color={ACCENT}>
            {measurementSystem === 'us' ? 'US' : 'Metric'}
          </Text>
        </Pressable>
      </Card>

      <Text variant="caption" color={colors.textSecondary} style={styles.sectionHeader}>
        DATA
      </Text>
      <Card>
        <Pressable
          style={styles.settingsRow}
          onPress={() => Alert.alert('Coming Soon', 'Export will be available in a future update.')}
        >
          <Text variant="body">Export Recipes (JSON)</Text>
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => Alert.alert('Coming Soon', 'Import will be available in a future update.')}
        >
          <Text variant="body">Import Recipes</Text>
        </Pressable>
      </Card>

      <Text variant="caption" color={colors.textSecondary} style={styles.sectionHeader}>
        ABOUT
      </Text>
      <Card>
        <View style={styles.settingsRow}>
          <Text variant="body">Version</Text>
          <Text variant="body" color={colors.textSecondary}>0.1.0</Text>
        </View>
        <View style={styles.separator} />
        <Pressable
          style={styles.settingsRow}
          onPress={() =>
            Alert.alert(
              'Privacy',
              'MyGarden stores all data locally on your device. No accounts, no cloud sync, no telemetry, no ads. Your recipes are yours alone.',
            )
          }
        >
          <Text variant="body">Privacy</Text>
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
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    letterSpacing: 1,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
