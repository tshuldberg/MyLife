import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import {
  getActiveGoals,
  createDailyGoals,
  updateDailyGoals,
  getSetting,
  setSetting,
  deleteSetting,
  purgeExpiredCache,
  exportFoodLogCSV,
  exportNutritionSummaryCSV,
  type DailyGoals,
} from '@mylife/nutrition';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const ACCENT = colors.modules.nutrition;

export default function SettingsScreen() {
  const db = useDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const goals: DailyGoals | null = useMemo(
    () => getActiveGoals(db, today),
    [db, today, tick],
  );

  const [calories, setCalories] = useState(String(goals?.calories ?? 2000));
  const [protein, setProtein] = useState(String(goals?.proteinG ?? 150));
  const [carbs, setCarbs] = useState(String(goals?.carbsG ?? 250));
  const [fat, setFat] = useState(String(goals?.fatG ?? 65));

  const units = useMemo(() => getSetting(db, 'units') ?? 'metric', [db, tick]);
  const apiKey = useMemo(() => getSetting(db, 'claude_api_key') ?? '', [db, tick]);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);

  const handleSaveGoals = () => {
    const cal = parseInt(calories, 10);
    const prot = parseInt(protein, 10);
    const carb = parseInt(carbs, 10);
    const f = parseInt(fat, 10);
    if (isNaN(cal) || isNaN(prot) || isNaN(carb) || isNaN(f)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for all goals.');
      return;
    }
    if (goals) {
      updateDailyGoals(db, goals.id, {
        calories: cal,
        proteinG: prot,
        carbsG: carb,
        fatG: f,
      });
    } else {
      createDailyGoals(db, uuid(), {
        calories: cal,
        proteinG: prot,
        carbsG: carb,
        fatG: f,
        effectiveDate: today,
      });
    }
    refresh();
    Alert.alert('Saved', 'Daily goals updated.');
  };

  const toggleUnits = () => {
    const next = units === 'metric' ? 'imperial' : 'metric';
    setSetting(db, 'units', next);
    refresh();
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setSetting(db, 'claude_api_key', apiKeyInput.trim());
    } else {
      deleteSetting(db, 'claude_api_key');
    }
    refresh();
    Alert.alert('Saved', 'API key updated.');
  };

  const handleExportLog = async () => {
    try {
      const csv = exportFoodLogCSV(db);
      await Share.share({ message: csv, title: 'Food Log Export' });
    } catch {
      Alert.alert('Error', 'Failed to export food log.');
    }
  };

  const handleExportSummary = async () => {
    try {
      const csv = exportNutritionSummaryCSV(db);
      await Share.share({ message: csv, title: 'Nutrition Summary Export' });
    } catch {
      Alert.alert('Error', 'Failed to export summary.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Barcode Cache',
      'This will remove cached barcode lookups. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            purgeExpiredCache(db);
            Alert.alert('Done', 'Barcode cache cleared.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Goals editor */}
      <Card>
        <Text variant="subheading">Daily Goals</Text>
        <View style={styles.goalsGrid}>
          <GoalInput label="Calories" value={calories} onChange={setCalories} unit="cal" />
          <GoalInput label="Protein" value={protein} onChange={setProtein} unit="g" />
          <GoalInput label="Carbs" value={carbs} onChange={setCarbs} unit="g" />
          <GoalInput label="Fat" value={fat} onChange={setFat} unit="g" />
        </View>
        <Pressable style={styles.primaryButton} onPress={handleSaveGoals}>
          <Text variant="label" color={colors.background}>Save Goals</Text>
        </Pressable>
      </Card>

      {/* Units */}
      <Card>
        <View style={styles.settingRow}>
          <View>
            <Text variant="body">Units</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {units === 'metric' ? 'Metric (g, ml)' : 'Imperial (oz, cups)'}
            </Text>
          </View>
          <Pressable style={styles.secondaryButton} onPress={toggleUnits}>
            <Text variant="caption" color={ACCENT}>Toggle</Text>
          </Pressable>
        </View>
      </Card>

      {/* API key */}
      <Card>
        <Text variant="subheading">AI Photo Logging</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.hint}>
          Enter your Claude API key to enable AI-powered food photo analysis.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          placeholderTextColor={colors.textTertiary}
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Pressable style={styles.secondaryButton} onPress={handleSaveApiKey}>
          <Text variant="label">Save API Key</Text>
        </Pressable>
      </Card>

      {/* Export */}
      <Card>
        <Text variant="subheading">Export Data</Text>
        <View style={styles.buttonGroup}>
          <Pressable style={styles.secondaryButton} onPress={handleExportLog}>
            <Text variant="label">Export Food Log (CSV)</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleExportSummary}>
            <Text variant="label">Export Summary (CSV)</Text>
          </Pressable>
        </View>
      </Card>

      {/* Cache */}
      <Card>
        <Text variant="subheading">Data Management</Text>
        <Pressable style={styles.dangerButton} onPress={handleClearCache}>
          <Text variant="label" color="#EF4444">Clear Barcode Cache</Text>
        </Pressable>
      </Card>

      {/* About */}
      <Card>
        <Text variant="subheading">About</Text>
        <Text variant="caption" color={colors.textSecondary}>
          MyNutrition v1.0 - Privacy-first nutrition tracking.
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          All data stored locally on your device. No cloud, no telemetry.
        </Text>
      </Card>
    </ScrollView>
  );
}

function GoalInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
}) {
  return (
    <View style={styles.goalItem}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <View style={styles.goalInputRow}>
        <TextInput
          style={styles.goalInput}
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholderTextColor={colors.textTertiary}
        />
        <Text variant="caption" color={colors.textTertiary}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  goalItem: { width: '47%', gap: 4 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: { marginTop: spacing.xs, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  buttonGroup: { marginTop: spacing.sm, gap: spacing.sm },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
