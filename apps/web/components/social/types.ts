/**
 * Placeholder social types for UI components.
 * TODO: Replace with imports from @mylife/social once the package is populated.
 */

export interface SocialProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  modulesUsed: number;
  totalActivities: number;
  kudosReceived: number;
  challengesCompleted: number;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  moduleId: string;
  moduleIcon: string;
  moduleAccentColor: string;
  activityType: 'book_finished' | 'workout_completed' | 'habit_streak' | 'challenge_joined' | 'goal_reached' | 'general';
  description: string;
  timestamp: string;
  kudosCount: number;
  hasKudosed: boolean;
  commentCount: number;
  comments: ActivityComment[];
}

export interface ActivityComment {
  id: string;
  userId: string;
  userDisplayName: string;
  text: string;
  timestamp: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  moduleIcon: string;
  moduleAccentColor: string;
  participantCount: number;
  startDate: string;
  endDate: string;
  isJoined: boolean;
  progress?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  fromAvatarUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  moduleId?: string;
  moduleIcon?: string;
  isJoined: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  moduleId: string;
}
