import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@mylife/ui';

const SOCIAL_ACCENT = '#7C4DFF';

// TODO: Replace with types and hooks from @mylife/social
interface SocialProfile {
  displayName: string;
  bio?: string;
  modulesUsed: number;
  totalActivities: number;
  kudosReceived: number;
  challengesCompleted: number;
}

const MOCK_PROFILE: SocialProfile = {
  displayName: 'You',
  bio: 'Privacy-first life tracker',
  modulesUsed: 5,
  totalActivities: 42,
  kudosReceived: 18,
  challengesCompleted: 2,
};

type ProfileTab = 'activity' | 'achievements';

export default function ProfileScreen() {
  const profile = MOCK_PROFILE;
  const [tab, setTab] = useState<ProfileTab>('activity');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Avatar + name */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {profile.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { value: profile.modulesUsed, label: 'Modules' },
          { value: profile.totalActivities, label: 'Activities' },
          { value: profile.kudosReceived, label: 'Kudos' },
          { value: profile.challengesCompleted, label: 'Challenges' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['activity', 'achievements'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tab,
              tab === t && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === t && styles.tabTextActive,
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {tab === 'activity' ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No activity to show yet.</Text>
        </View>
      ) : (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>
            Achievements coming soon. Complete challenges to earn badges.
          </Text>
        </View>
      )}

      {/* Edit profile button */}
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: SOCIAL_ACCENT,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: SOCIAL_ACCENT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: SOCIAL_ACCENT,
  },
  emptySection: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  editButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
