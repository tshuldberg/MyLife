'use client';

import { useState } from 'react';
import { ProfileCard } from '@/components/social/ProfileCard';
import type { SocialProfile, FriendRequest } from '@/components/social/types';

// TODO: Replace with useFriends() from @mylife/social
function useFriends(): {
  friends: SocialProfile[];
  requests: FriendRequest[];
  loading: boolean;
} {
  return { friends: MOCK_FRIENDS, requests: MOCK_REQUESTS, loading: false };
}

type FriendsTab = 'following' | 'requests' | 'search';

export default function FriendsPage() {
  const { friends, requests, loading } = useFriends();
  const [tab, setTab] = useState<FriendsTab>('following');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return <p style={styles.loadingText}>Loading friends...</p>;
  }

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabs}>
        {(
          [
            { id: 'following', label: `Following (${friends.length})` },
            { id: 'requests', label: `Requests (${requests.length})` },
            { id: 'search', label: 'Find Friends' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tab,
              color:
                tab === t.id
                  ? 'var(--accent-social)'
                  : 'var(--text-tertiary)',
              borderBottomColor:
                tab === t.id ? 'var(--accent-social)' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'following' && (
        <div style={styles.list}>
          {friends.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>No friends yet</p>
              <p style={styles.emptyText}>
                Search for users to connect with.
              </p>
            </div>
          ) : (
            friends.map((friend) => (
              <ProfileCard
                key={friend.id}
                profile={friend}
                isFollowing={true}
                onFollow={() => {}}
              />
            ))
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div style={styles.list}>
          {requests.length === 0 ? (
            <p style={styles.emptyText}>No pending requests.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} style={styles.requestCard}>
                <div style={styles.requestInfo}>
                  <div style={styles.requestAvatar}>
                    <span style={styles.requestAvatarText}>
                      {req.fromDisplayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span style={styles.requestName}>
                      {req.fromDisplayName}
                    </span>
                    <span style={styles.requestTime}>
                      wants to connect
                    </span>
                  </div>
                </div>
                <div style={styles.requestActions}>
                  <button type="button" style={styles.acceptButton}>
                    Accept
                  </button>
                  <button type="button" style={styles.declineButton}>
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'search' && (
        <div style={styles.searchSection}>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 ? (
            <p style={styles.emptyText}>
              Search results will appear here once social backend is connected.
            </p>
          ) : (
            <p style={styles.emptyText}>
              Enter a name to find and follow other MyLife users.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '640px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid var(--border)',
  },
  tab: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid',
    cursor: 'pointer',
    font: 'inherit',
    transition: 'color 0.15s',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    marginTop: '8px',
  },
  requestCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '12px 16px',
  },
  requestInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  requestAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    backgroundColor: 'var(--surface-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  requestName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    display: 'block',
  },
  requestTime: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  requestActions: {
    display: 'flex',
    gap: '8px',
  },
  acceptButton: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-social)',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    font: 'inherit',
  },
  declineButton: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    font: 'inherit',
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    fontSize: '14px',
    font: 'inherit',
    outline: 'none',
  },
};

const MOCK_FRIENDS: SocialProfile[] = [
  {
    id: 'u1',
    displayName: 'Alex',
    bio: 'Book lover and fitness enthusiast',
    modulesUsed: 4,
    totalActivities: 87,
    kudosReceived: 34,
    challengesCompleted: 3,
  },
  {
    id: 'u3',
    displayName: 'Sam',
    bio: 'Meditation and habits tracker',
    modulesUsed: 3,
    totalActivities: 156,
    kudosReceived: 89,
    challengesCompleted: 7,
  },
];

const MOCK_REQUESTS: FriendRequest[] = [
  {
    id: 'r1',
    fromUserId: 'u4',
    fromDisplayName: 'Riley',
    status: 'pending',
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
  },
];
