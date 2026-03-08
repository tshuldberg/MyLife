'use client';

import { ChallengeCard } from '@/components/social/ChallengeCard';
import type { Challenge } from '@/components/social/types';

// TODO: Replace with useChallenges() from @mylife/social
function useChallenges(): { challenges: Challenge[]; loading: boolean } {
  return { challenges: MOCK_CHALLENGES, loading: false };
}

export default function ChallengesPage() {
  const { challenges, loading } = useChallenges();

  if (loading) {
    return <p style={styles.loadingText}>Loading challenges...</p>;
  }

  return (
    <div style={styles.container}>
      {challenges.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No active challenges</p>
          <p style={styles.emptyText}>
            Challenges will appear here once they are created by the community.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
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

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'ch1',
    title: '30 Books in 2026',
    description:
      'Read 30 books this year. Log each one in MyBooks as you finish.',
    moduleId: 'books',
    moduleIcon: '\u{1F4DA}',
    moduleAccentColor: '#C9894D',
    participantCount: 24,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isJoined: true,
    progress: 18,
  },
  {
    id: 'ch2',
    title: 'Workout Streak: March',
    description:
      'Complete at least one workout every day in March. Any workout type counts.',
    moduleId: 'workouts',
    moduleIcon: '\u{1F3CB}\uFE0F',
    moduleAccentColor: '#EF4444',
    participantCount: 56,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    isJoined: false,
  },
  {
    id: 'ch3',
    title: 'Mindful Month',
    description:
      'Build a daily meditation habit for 30 consecutive days using MyHabits.',
    moduleId: 'habits',
    moduleIcon: '\u{1F9D8}',
    moduleAccentColor: '#8B5CF6',
    participantCount: 31,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    isJoined: true,
    progress: 42,
  },
];
