import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { getSetting, setSetting } from '@mylife/subs';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function boolSetting(value: string | null, fallback = false): boolean {
  if (value == null) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export default function SubsSettingsScreen() {
  const db = useDatabase();

  const [defaultNotifyDays, setDefaultNotifyDays] = useState(
    getSetting(db, 'default_notify_days') ?? '1',
  );
  const [currency, setCurrency] = useState(getSetting(db, 'default_currency') ?? 'USD');
  const [renewalReminders, setRenewalReminders] = useState(
    boolSetting(getSetting(db, 'renewal_reminders'), true),
  );

  const save = () => {
    setSetting(db, 'default_notify_days', String(Math.max(0, Number(defaultNotifyDays) || 0)));
    setSetting(db, 'default_currency', (currency.trim() || 'USD').toUpperCase());
    setSetting(db, 'renewal_reminders', renewalReminders ? '1' : '0');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Defaults</Text>
        <View style={styles.formRow}>
          <Text variant="caption" color={colors.textSecondary}>Default reminder days</Text>
          <TextInput
            style={styles.input}
            value={defaultNotifyDays}
            onChangeText={setDefaultNotifyDays}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.formRow}>
          <Text variant="caption" color={colors.textSecondary}>Default currency</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            placeholder="USD"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Notifications</Text>
        <View style={styles.switchRow}>
          <Text variant="body">Renewal reminders</Text>
          <Switch
            value={renewalReminders}
            onValueChange={setRenewalReminders}
            trackColor={{ false: colors.surfaceElevated, true: colors.modules.subs }}
          />
        </View>
      </Card>

      <Pressable style={styles.primaryButton} onPress={save}>
        <Text variant="label" color={colors.background}>Save Settings</Text>
      </Pressable>
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
  formRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
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
  switchRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.subs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
