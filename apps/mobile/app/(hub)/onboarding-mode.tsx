import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Text, colors, spacing, borderRadius } from '@mylife/ui';
import type { PlanMode } from '@mylife/entitlements';
import { incrementAggregateEventCounter } from '@mylife/db';
import { useDatabase } from '../../components/DatabaseProvider';
import { saveModeConfig } from '../../lib/entitlements';

export default function OnboardingModeScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [selfHostUrl, setSelfHostUrl] = useState('');

  const chooseMode = (mode: PlanMode) => {
    const serverUrl = mode === 'self_host' ? selfHostUrl || null : null;
    saveModeConfig(db, mode, serverUrl);
    incrementAggregateEventCounter(db, `mode_selected:${mode}`);
    router.replace('/(hub)/settings');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text variant="heading">Choose Your Mode</Text>
      <Text variant="body" color={colors.textSecondary}>
        You can change this later in Settings.
      </Text>

      <Card style={styles.card}>
        <Text variant="subheading">Hosted</Text>
        <Text variant="caption" color={colors.textSecondary}>Use MyLife managed servers.</Text>
        <Pressable style={styles.button} onPress={() => chooseMode('hosted')}>
          <Text variant="label">Use Hosted</Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Text variant="subheading">Self-Host</Text>
        <Text variant="caption" color={colors.textSecondary}>Connect to your own endpoint.</Text>
        <TextInput
          value={selfHostUrl}
          onChangeText={setSelfHostUrl}
          autoCapitalize="none"
          placeholder="https://home.example.com"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={() => chooseMode('self_host')}>
          <Text variant="label">Use Self-Host</Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Text variant="subheading">Local-Only</Text>
        <Text variant="caption" color={colors.textSecondary}>Keep data only on this device.</Text>
        <Pressable style={styles.button} onPress={() => chooseMode('local_only')}>
          <Text variant="label">Use Local-Only</Text>
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
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
