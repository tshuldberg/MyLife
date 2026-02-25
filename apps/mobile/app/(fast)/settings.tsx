import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { getSetting, setSetting } from '@mylife/fast';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function settingBool(value: string | null, fallback = false): boolean {
  if (value == null) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export default function FastSettingsScreen() {
  const db = useDatabase();

  const [defaultProtocol, setDefaultProtocol] = useState(
    getSetting(db, 'defaultProtocol') ?? '16:8',
  );
  const [notifyFastComplete, setNotifyFastComplete] = useState(
    settingBool(getSetting(db, 'notifyFastComplete'), true),
  );
  const [notifyEatingWindowClosing, setNotifyEatingWindowClosing] = useState(
    settingBool(getSetting(db, 'notifyEatingWindowClosing'), false),
  );

  const save = () => {
    setSetting(db, 'defaultProtocol', defaultProtocol.trim() || '16:8');
    setSetting(db, 'notifyFastComplete', notifyFastComplete ? '1' : '0');
    setSetting(
      db,
      'notifyEatingWindowClosing',
      notifyEatingWindowClosing ? '1' : '0',
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Timer Defaults</Text>
        <View style={styles.formRow}>
          <Text variant="caption" color={colors.textSecondary}>Default protocol</Text>
          <TextInput
            style={styles.input}
            value={defaultProtocol}
            onChangeText={setDefaultProtocol}
            placeholder="16:8"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Notifications</Text>
        <View style={styles.switchRow}>
          <Text variant="body">Fast complete</Text>
          <Switch
            value={notifyFastComplete}
            onValueChange={setNotifyFastComplete}
            trackColor={{ false: colors.surfaceElevated, true: colors.modules.fast }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text variant="body">Eating window closing</Text>
          <Switch
            value={notifyEatingWindowClosing}
            onValueChange={setNotifyEatingWindowClosing}
            trackColor={{ false: colors.surfaceElevated, true: colors.modules.fast }}
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
    borderRadius: 10,
    backgroundColor: colors.modules.fast,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
