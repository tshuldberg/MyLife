import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Alert, Pressable, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { getGoals, getSetting } from '@mylife/budget';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

function SettingsRow({ label, value, onPress, toggle, onToggle, destructive }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      disabled={!onPress && !onToggle}
    >
      <Text variant="body" color={destructive ? colors.danger : colors.text}>
        {label}
      </Text>
      {toggle !== undefined && onToggle ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ true: BUDGET_ACCENT, false: colors.border }}
        />
      ) : value ? (
        <Text variant="caption" color={colors.textSecondary}>
          {value}
        </Text>
      ) : null}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text variant="caption" style={styles.sectionHeader}>
      {title}
    </Text>
  );
}

export default function BudgetSettingsScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  const goalsCount = useMemo(() => {
    try {
      return getGoals(db).length;
    } catch {
      return 0;
    }
  }, [db]);

  const currencyCode = useMemo(() => {
    try {
      const val = getSetting(db, 'currency');
      return val ?? 'USD';
    } catch {
      return 'USD';
    }
  }, [db]);

  const handleCurrencyFormat = useCallback(() => {
    Alert.alert('Currency Format', 'Multi-currency support is planned for a future release.');
  }, []);

  const handleFirstDayOfWeek = useCallback(() => {
    Alert.alert('First Day of Week', 'Week start customization will be available soon.');
  }, []);

  const handleCsvProfiles = useCallback(() => {
    router.push('/(budget)/import-csv');
  }, [router]);

  const handleExportData = useCallback(() => {
    Alert.alert('Export Data', 'Export to CSV/JSON is in progress and will ship in an upcoming update.');
  }, []);

  const handleLicenses = useCallback(() => {
    Alert.alert('Licenses', 'Open-source license details are being prepared.');
  }, []);

  const handlePrivacyStatement = useCallback(() => {
    Alert.alert('Privacy Statement', 'MyBudget keeps your data local on-device only. Full statement coming soon.');
  }, []);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset Budget Data',
      'This will delete all budget data (envelopes, transactions, accounts, subscriptions). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Reset', 'Budget data reset is not yet implemented in the hub app.');
          },
        },
      ],
    );
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <SectionHeader title="SECURITY" />
      <Card style={styles.section}>
        <SettingsRow
          label="App Lock (Face ID / Touch ID)"
          toggle={appLockEnabled}
          onToggle={setAppLockEnabled}
        />
      </Card>

      <SectionHeader title="PREFERENCES" />
      <Card style={styles.section}>
        <SettingsRow label="Currency Format" value={currencyCode} onPress={handleCurrencyFormat} />
        <View style={styles.divider} />
        <SettingsRow label="First Day of Week" value="Sunday" onPress={handleFirstDayOfWeek} />
      </Card>

      <SectionHeader title="FEATURES" />
      <Card style={styles.section}>
        <SettingsRow
          label="Goals"
          value={`${goalsCount} goal${goalsCount !== 1 ? 's' : ''}`}
          onPress={() => router.push('/(budget)/goals')}
        />
      </Card>

      <SectionHeader title="DATA" />
      <Card style={styles.section}>
        <SettingsRow label="CSV Import Profiles" onPress={handleCsvProfiles} />
        <View style={styles.divider} />
        <SettingsRow label="Export Data" value="CSV / JSON" onPress={handleExportData} />
      </Card>

      <SectionHeader title="ABOUT" />
      <Card style={styles.section}>
        <SettingsRow label="Version" value="0.1.0" />
        <View style={styles.divider} />
        <SettingsRow label="Licenses" onPress={handleLicenses} />
        <View style={styles.divider} />
        <SettingsRow label="Privacy Statement" onPress={handlePrivacyStatement} />
      </Card>

      <SectionHeader title="DANGER ZONE" />
      <Card style={styles.section}>
        <SettingsRow label="Reset All Data" onPress={handleResetData} destructive />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});
