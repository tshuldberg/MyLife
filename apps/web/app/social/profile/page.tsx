'use client';

import { useState } from 'react';
import { ShareCardPreview } from '@/components/social/ShareCardPreview';
import type { SocialProfile, ActivityItem } from '@/components/social/types';
import { ActivityCard } from '@/components/social/ActivityCard';

// TODO: Replace with useProfile() from @mylife/social
function useProfile(): { profile: SocialProfile; loading: boolean } {
  return { profile: MOCK_PROFILE, loading: false };
}

// TODO: Replace with useProfileActivities() from @mylife/social
function useProfileActivities(): { activities: ActivityItem[] } {
  return { activities: [] };
}

type ProfileTab = 'activity' | 'achievements' | 'share';

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const { activities } = useProfileActivities();
  const [tab, setTab] = useState<ProfileTab>('activity');

  if (loading) {
    return <p style={styles.loadingText}>Loading profile...</p>;
  }

  return (
    <div style={styles.container}>
      {/* Profile header */}
      <div style={styles.profileHeader}>
        <div style={styles.avatarLarge}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              style={styles.avatarImage}
            />
          ) : (
            <span style={styles.avatarFallback}>
              {profile.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div style={styles.profileInfo}>
          <h2 style={styles.displayName}>{profile.displayName}</h2>
          {profile.bio && <p style={styles.bio}>{profile.bio}</p>}
        </div>
        <button type="button" style={styles.editButton}>
          Edit Profile
        </button>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        {[
          { value: profile.modulesUsed, label: 'Modules' },
          { value: profile.totalActivities, label: 'Activities' },
          { value: profile.kudosReceived, label: 'Kudos' },
          { value: profile.challengesCompleted, label: 'Challenges' },
        ].map((stat) => (
          <div key={stat.label} style={styles.statCard}>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(
          [
            { id: 'activity', label: 'Activity' },
            { id: 'achievements', label: 'Achievements' },
            { id: 'share', label: 'Share Card' },
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

      {/* Tab content */}
      {tab === 'activity' && (
        <div style={styles.activityList}>
          {activities.length === 0 ? (
            <p style={styles.emptyText}>No activity to show yet.</p>
          ) : (
            activities.map((a) => <ActivityCard key={a.id} activity={a} />)
          )}
        </div>
      )}

      {tab === 'achievements' && (
        <div style={styles.emptySection}>
          <p style={styles.emptyText}>
            Achievements coming soon. Complete challenges and hit milestones to
            earn badges.
          </p>
        </div>
      )}

      {tab === 'share' && (
        <div style={styles.shareSection}>
          <p style={styles.shareDesc}>
            Preview your shareable profile card. Share your MyLife stats with
            friends.
          </p>
          <ShareCardPreview
            title={profile.displayName}
            subtitle={`${profile.modulesUsed} modules active`}
            moduleIcon={'\u{1F30D}'}
            moduleAccentColor="#7C4DFF"
            stat={String(profile.kudosReceived)}
            statLabel="kudos received"
          />
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
    gap: '24px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatarLarge: {
    width: '72px',
    height: '72px',
    borderRadius: '36px',
    backgroundColor: 'var(--surface-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  avatarFallback: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  bio: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
    marginTop: '4px',
  },
  editButton: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    font: 'inherit',
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--accent-social)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
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
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptySection: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  shareSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  shareDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
};

const MOCK_PROFILE: SocialProfile = {
  id: 'me',
  displayName: 'You',
  bio: 'Privacy-first life tracker',
  modulesUsed: 5,
  totalActivities: 42,
  kudosReceived: 18,
  challengesCompleted: 2,
};
