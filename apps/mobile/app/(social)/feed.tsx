import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '@mylife/ui';

const SOCIAL_ACCENT = '#7C4DFF';

// TODO: Replace with types from @mylife/social
interface ActivityItem {
  id: string;
  userDisplayName: string;
  moduleIcon: string;
  moduleAccentColor: string;
  description: string;
  timestamp: string;
  kudosCount: number;
  hasKudosed: boolean;
}

// TODO: Replace with useSocialEnabled() and useFeed() from @mylife/social
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    userDisplayName: 'Alex',
    moduleIcon: '\u{1F4DA}',
    moduleAccentColor: '#C9894D',
    description: 'Finished reading "The Great Gatsby" and rated it 4.5 stars',
    timestamp: new Date(Date.now() - 3_600_000).toISOString(),
    kudosCount: 3,
    hasKudosed: false,
  },
  {
    id: '2',
    userDisplayName: 'Jordan',
    moduleIcon: '\u{1F3CB}\uFE0F',
    moduleAccentColor: '#EF4444',
    description: 'Completed a 45-minute strength training session',
    timestamp: new Date(Date.now() - 7_200_000).toISOString(),
    kudosCount: 5,
    hasKudosed: true,
  },
  {
    id: '3',
    userDisplayName: 'Sam',
    moduleIcon: '\u{1F31F}',
    moduleAccentColor: '#8B5CF6',
    description: 'Hit a 30-day meditation streak!',
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
    kudosCount: 12,
    hasKudosed: false,
  },
];

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function FeedScreen() {
  const [socialEnabled, setSocialEnabled] = useState(false);

  if (!socialEnabled) {
    return (
      <View style={styles.onboarding}>
        <View style={styles.onboardingIcon}>
          <Text style={styles.onboardingEmoji}>{'\u{1F91D}'}</Text>
        </View>
        <Text style={styles.onboardingTitle}>Social Features</Text>
        <Text style={styles.onboardingDesc}>
          Connect with friends, share achievements, and join challenges. Your
          data stays private until you choose to share.
        </Text>
        <TouchableOpacity
          style={styles.enableButton}
          onPress={() => setSocialEnabled(true)}
        >
          <Text style={styles.enableButtonText}>Enable Social Features</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={MOCK_ACTIVITIES}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <ActivityCardMobile activity={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyText}>
            Follow friends to see their activities here.
          </Text>
        </View>
      }
    />
  );
}

function ActivityCardMobile({ activity }: { activity: ActivityItem }) {
  const [kudosed, setKudosed] = useState(activity.hasKudosed);
  const [kudosCount, setKudosCount] = useState(activity.kudosCount);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {activity.userDisplayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.userName}>{activity.userDisplayName}</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(activity.timestamp)}
          </Text>
        </View>
        <View
          style={[
            styles.moduleBadge,
            { backgroundColor: `${activity.moduleAccentColor}1A` },
          ]}
        >
          <Text style={styles.moduleIconText}>{activity.moduleIcon}</Text>
        </View>
      </View>

      <Text style={styles.description}>{activity.description}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.kudosButton}
          onPress={() => {
            setKudosed(!kudosed);
            setKudosCount((c) => (kudosed ? c - 1 : c + 1));
          }}
        >
          <Text style={styles.kudosIcon}>
            {kudosed ? '\u2764\uFE0F' : '\u2661'}
          </Text>
          {kudosCount > 0 && (
            <Text
              style={[
                styles.kudosCount,
                { color: kudosed ? SOCIAL_ACCENT : colors.textTertiary },
              ]}
            >
              {kudosCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  moduleBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconText: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  kudosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kudosIcon: {
    fontSize: 16,
  },
  kudosCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Onboarding
  onboarding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  onboardingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${SOCIAL_ACCENT}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  onboardingEmoji: {
    fontSize: 28,
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  onboardingDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  enableButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: SOCIAL_ACCENT,
    alignItems: 'center',
    marginBottom: 12,
  },
  enableButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  // Empty state
  empty: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
