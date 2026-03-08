import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getMoonPhase, getStarsStats, getBirthProfiles } from '@mylife/stars';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const MOON_PHASE_LABELS: Record<string, string> = {
  new_moon: 'New Moon',
  waxing_crescent: 'Waxing Crescent',
  first_quarter: 'First Quarter',
  waxing_gibbous: 'Waxing Gibbous',
  full_moon: 'Full Moon',
  waning_gibbous: 'Waning Gibbous',
  last_quarter: 'Last Quarter',
  waning_crescent: 'Waning Crescent',
};

const MOON_PHASE_ICONS: Record<string, string> = {
  new_moon: '\u{1F311}',
  waxing_crescent: '\u{1F312}',
  first_quarter: '\u{1F313}',
  waxing_gibbous: '\u{1F314}',
  full_moon: '\u{1F315}',
  waning_gibbous: '\u{1F316}',
  last_quarter: '\u{1F317}',
  waning_crescent: '\u{1F318}',
};

const accentColor = '#8B5CF6';

export default function StarsHomeScreen() {
  const db = useDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => getStarsStats(db), [db]);
  const profiles = useMemo(() => getBirthProfiles(db), [db]);
  const moonPhase = useMemo(() => getMoonPhase(today), [today]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.moonRow}>
          <Text style={styles.moonIcon}>{MOON_PHASE_ICONS[moonPhase]}</Text>
          <View>
            <Text variant="subheading">{MOON_PHASE_LABELS[moonPhase]}</Text>
            <Text variant="caption" color={colors.textSecondary}>Today&apos;s Moon Phase</Text>
          </View>
        </View>
      </Card>

      <View style={styles.metricsGrid}>
        <Metric label="Profiles" value={String(stats.totalProfiles)} />
        <Metric label="Transits" value={String(stats.totalTransits)} />
        <Metric label="Readings" value={String(stats.totalReadings)} />
        <Metric label="Charts" value={String(stats.totalSavedCharts)} />
      </View>

      <Card>
        <Text variant="subheading">Birth Profiles</Text>
        <View style={styles.list}>
          {profiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color={colors.textSecondary}>
                No birth profiles yet. Add your first profile to get started.
              </Text>
            </View>
          ) : (
            profiles.map((profile) => (
              <Card key={profile.id} style={styles.innerCard}>
                <Text variant="body">{profile.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {profile.birthDate}
                  {profile.sunSign ? ` \u2022 ${profile.sunSign}` : ''}
                </Text>
              </Card>
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text style={[styles.metricValue, { color: accentColor }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  moonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  moonIcon: { fontSize: 48 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flex: 1, minWidth: 75, gap: spacing.xs },
  metricValue: { fontSize: 22, fontWeight: '700' },
  list: { marginTop: spacing.sm },
  innerCard: { marginBottom: spacing.sm, backgroundColor: colors.surfaceElevated },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
});
