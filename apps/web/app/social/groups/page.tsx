'use client';

import type { Group } from '@/components/social/types';

// TODO: Replace with useGroups() from @mylife/social
function useGroups(): { groups: Group[]; loading: boolean } {
  return { groups: MOCK_GROUPS, loading: false };
}

export default function GroupsPage() {
  const { groups, loading } = useGroups();

  if (loading) {
    return <p style={styles.loadingText}>Loading groups...</p>;
  }

  return (
    <div style={styles.container}>
      {groups.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No groups yet</p>
          <p style={styles.emptyText}>
            Groups let you connect with people who share your interests.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {groups.map((group) => (
            <div key={group.id} style={styles.card}>
              <div style={styles.cardHeader}>
                {group.moduleIcon && (
                  <span style={styles.moduleIcon}>{group.moduleIcon}</span>
                )}
                <div style={styles.cardHeaderText}>
                  <h3 style={styles.groupName}>{group.name}</h3>
                  <p style={styles.memberCount}>
                    {group.memberCount} member
                    {group.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p style={styles.groupDesc}>{group.description}</p>
              <div style={styles.cardFooter}>
                {group.isJoined ? (
                  <span style={styles.joinedBadge}>Joined</span>
                ) : (
                  <button type="button" style={styles.joinButton}>
                    Join
                  </button>
                )}
              </div>
            </div>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  moduleIcon: {
    fontSize: '24px',
  },
  cardHeaderText: {
    flex: 1,
  },
  groupName: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  memberCount: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    margin: 0,
    marginTop: '2px',
  },
  groupDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    margin: 0,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  joinButton: {
    padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-social)',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    font: 'inherit',
  },
  joinedBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--success)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
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

const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Book Club',
    description:
      'Monthly book picks and discussions. We read one book together each month.',
    memberCount: 18,
    moduleId: 'books',
    moduleIcon: '\u{1F4DA}',
    isJoined: true,
  },
  {
    id: 'g2',
    name: 'Morning Workout Crew',
    description:
      'Early birds who work out before 7 AM. Share your morning routines.',
    memberCount: 42,
    moduleId: 'workouts',
    moduleIcon: '\u{1F3CB}\uFE0F',
    isJoined: false,
  },
  {
    id: 'g3',
    name: 'Habit Builders',
    description:
      'Support group for building and maintaining daily habits. Share tips and stay accountable.',
    memberCount: 29,
    moduleId: 'habits',
    moduleIcon: '\u{1F31F}',
    isJoined: false,
  },
];
