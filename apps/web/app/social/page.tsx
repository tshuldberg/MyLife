'use client';

import { useState } from 'react';
import { ActivityCard } from '@/components/social/ActivityCard';
import { SocialOnboarding } from '@/components/social/SocialOnboarding';
import type { ActivityItem } from '@/components/social/types';

// TODO: Replace with useSocialEnabled() hook from @mylife/social
function useSocialEnabled(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState(false);
  return [enabled, setEnabled];
}

// TODO: Replace with useFeed() hook from @mylife/social
function useFeed(): { activities: ActivityItem[]; loading: boolean } {
  return { activities: MOCK_ACTIVITIES, loading: false };
}

export default function SocialFeedPage() {
  const [socialEnabled, setSocialEnabled] = useSocialEnabled();
  const { activities, loading } = useFeed();

  if (!socialEnabled) {
    return <SocialOnboarding onComplete={(opted) => setSocialEnabled(opted)} />;
  }

  return (
    <div>
      {loading ? (
        <p style={styles.loadingText}>Loading feed...</p>
      ) : activities.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No activity yet</p>
          <p style={styles.emptyText}>
            Follow friends to see their activities here.
          </p>
        </div>
      ) : (
        <div style={styles.feed}>
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '640px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  empty: {
    textAlign: 'center',
    padding: '64px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
};

// Placeholder data for development
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    userId: 'u1',
    userDisplayName: 'Alex',
    moduleId: 'books',
    moduleIcon: '\u{1F4DA}',
    moduleAccentColor: '#C9894D',
    activityType: 'book_finished',
    description: 'Finished reading "The Great Gatsby" and rated it 4.5 stars',
    timestamp: new Date(Date.now() - 3_600_000).toISOString(),
    kudosCount: 3,
    hasKudosed: false,
    commentCount: 1,
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        userDisplayName: 'Jordan',
        text: 'Such a classic! What did you think of the ending?',
        timestamp: new Date(Date.now() - 1_800_000).toISOString(),
      },
    ],
  },
  {
    id: '2',
    userId: 'u2',
    userDisplayName: 'Jordan',
    moduleId: 'workouts',
    moduleIcon: '\u{1F3CB}\uFE0F',
    moduleAccentColor: '#EF4444',
    activityType: 'workout_completed',
    description: 'Completed a 45-minute strength training session',
    timestamp: new Date(Date.now() - 7_200_000).toISOString(),
    kudosCount: 5,
    hasKudosed: true,
    commentCount: 0,
    comments: [],
  },
  {
    id: '3',
    userId: 'u3',
    userDisplayName: 'Sam',
    moduleId: 'habits',
    moduleIcon: '\u{1F31F}',
    moduleAccentColor: '#8B5CF6',
    activityType: 'habit_streak',
    description: 'Hit a 30-day meditation streak!',
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
    kudosCount: 12,
    hasKudosed: false,
    commentCount: 3,
    comments: [
      {
        id: 'c2',
        userId: 'u1',
        userDisplayName: 'Alex',
        text: 'Incredible consistency!',
        timestamp: new Date(Date.now() - 82_800_000).toISOString(),
      },
      {
        id: 'c3',
        userId: 'u4',
        userDisplayName: 'Riley',
        text: 'Inspiring. I need to get back on track.',
        timestamp: new Date(Date.now() - 79_200_000).toISOString(),
      },
    ],
  },
];
