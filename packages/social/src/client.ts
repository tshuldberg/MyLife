/**
 * @mylife/social -- Supabase client wrapper for social operations.
 *
 * All operations require the user to have a social profile (opt-in).
 * Uses the shared Supabase client from @mylife/auth.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SocialProfile,
  CreateProfileInput,
  Follow,
  FollowStatus,
  Activity,
  CreateActivityInput,
  Kudos,
  KudosEmoji,
  Comment,
  Challenge,
  CreateChallengeInput,
  ChallengeMember,
  Group,
  GroupMember,
  GroupRole,
  LeaderboardConfig,
  LeaderboardEntry,
  LeaderboardScope,
  LeaderboardTimeframe,
  Visibility,
  PrivacySettings,
} from './types';

// ── Result Type ─────────────────────────────────────────────────────────

export type SocialResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): SocialResult<T> {
  return { ok: true, data };
}

function err<T>(error: string): SocialResult<T> {
  return { ok: false, error };
}

// ── Social Client ───────────────────────────────────────────────────────

export class SocialClient {
  constructor(private supabase: SupabaseClient) {}

  // ── Profile ─────────────────────────────────────────────────────────

  /** Check if the current user has a social profile. */
  async hasProfile(): Promise<SocialResult<boolean>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return err('Not authenticated');

    const { count, error } = await this.supabase
      .from('social_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) return err(error.message);
    return ok((count ?? 0) > 0);
  }

  /** Get the current user's social profile. */
  async getMyProfile(): Promise<SocialResult<SocialProfile | null>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return err('Not authenticated');

    const { data, error } = await this.supabase
      .from('social_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return err(error.message);
    return ok(data ? mapProfile(data) : null);
  }

  /** Create a social profile for the current user (opt-in). */
  async createProfile(input: CreateProfileInput): Promise<SocialResult<SocialProfile>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return err('Not authenticated');

    const { data, error } = await this.supabase
      .from('social_profiles')
      .insert({
        user_id: user.id,
        handle: input.handle,
        display_name: input.displayName,
        bio: input.bio ?? null,
        avatar_url: input.avatarUrl ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('handle')) {
        return err('Handle is already taken');
      }
      return err(error.message);
    }
    return ok(mapProfile(data));
  }

  /** Update the current user's profile. */
  async updateProfile(
    updates: Partial<Pick<SocialProfile, 'displayName' | 'bio' | 'avatarUrl' | 'enabledModules'>>,
  ): Promise<SocialResult<SocialProfile>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return err('Not authenticated');

    const updateData: Record<string, unknown> = {};
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.enabledModules !== undefined) updateData.enabled_modules = updates.enabledModules;

    const { data, error } = await this.supabase
      .from('social_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(mapProfile(data));
  }

  /** Update privacy settings for the current user. */
  async updatePrivacySettings(settings: PrivacySettings): Promise<SocialResult<SocialProfile>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return err('Not authenticated');

    const { data, error } = await this.supabase
      .from('social_profiles')
      .update({ privacy_settings: settings })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(mapProfile(data));
  }

  /** Look up a profile by handle. */
  async getProfileByHandle(handle: string): Promise<SocialResult<SocialProfile | null>> {
    const { data, error } = await this.supabase
      .from('social_profiles')
      .select('*')
      .eq('handle', handle)
      .maybeSingle();

    if (error) return err(error.message);
    return ok(data ? mapProfile(data) : null);
  }

  /** Check if a handle is available. */
  async isHandleAvailable(handle: string): Promise<SocialResult<boolean>> {
    const { count, error } = await this.supabase
      .from('social_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('handle', handle);

    if (error) return err(error.message);
    return ok((count ?? 0) === 0);
  }

  /** Search profiles by handle or display name. */
  async searchProfiles(query: string, limit = 20): Promise<SocialResult<SocialProfile[]>> {
    const { data, error } = await this.supabase
      .from('social_profiles')
      .select('*')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit);

    if (error) return err(error.message);
    return ok((data ?? []).map(mapProfile));
  }

  // ── Follows ─────────────────────────────────────────────────────────

  /** Follow a user. Returns 'active' or 'pending' depending on their settings. */
  async follow(targetProfileId: string): Promise<SocialResult<Follow>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    // Check target's follow settings
    const { data: target } = await this.supabase
      .from('social_profiles')
      .select('privacy_settings')
      .eq('id', targetProfileId)
      .single();

    const status: FollowStatus = target?.privacy_settings?.openFollows ? 'active' : 'pending';

    const { data, error } = await this.supabase
      .from('social_follows')
      .insert({
        follower_id: myProfile.data.id,
        followee_id: targetProfileId,
        status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return err('Already following this user');
      return err(error.message);
    }
    return ok(mapFollow(data));
  }

  /** Unfollow a user. */
  async unfollow(targetProfileId: string): Promise<SocialResult<void>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { error } = await this.supabase
      .from('social_follows')
      .delete()
      .eq('follower_id', myProfile.data.id)
      .eq('followee_id', targetProfileId);

    if (error) return err(error.message);
    return ok(undefined);
  }

  /** Accept a pending follow request. */
  async acceptFollowRequest(followId: string): Promise<SocialResult<Follow>> {
    const { data, error } = await this.supabase
      .from('social_follows')
      .update({ status: 'active' })
      .eq('id', followId)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(mapFollow(data));
  }

  /** Reject (delete) a pending follow request. */
  async rejectFollowRequest(followId: string): Promise<SocialResult<void>> {
    const { error } = await this.supabase
      .from('social_follows')
      .delete()
      .eq('id', followId)
      .eq('status', 'pending');

    if (error) return err(error.message);
    return ok(undefined);
  }

  /** Get followers of a profile. */
  async getFollowers(
    profileId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<SocialResult<SocialProfile[]>> {
    const { limit = 50, offset = 0 } = opts;

    const { data, error } = await this.supabase
      .from('social_follows')
      .select('follower:social_profiles!social_follows_follower_id_fkey(*)')
      .eq('followee_id', profileId)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    if (error) return err(error.message);
    return ok((data ?? []).map((row: any) => mapProfile(row.follower)));
  }

  /** Get profiles that a user follows. */
  async getFollowing(
    profileId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<SocialResult<SocialProfile[]>> {
    const { limit = 50, offset = 0 } = opts;

    const { data, error } = await this.supabase
      .from('social_follows')
      .select('followee:social_profiles!social_follows_followee_id_fkey(*)')
      .eq('follower_id', profileId)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    if (error) return err(error.message);
    return ok((data ?? []).map((row: any) => mapProfile(row.followee)));
  }

  /** Get pending follow requests for the current user. */
  async getPendingFollowRequests(): Promise<SocialResult<Follow[]>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_follows')
      .select('*')
      .eq('followee_id', myProfile.data.id)
      .eq('status', 'pending');

    if (error) return err(error.message);
    return ok((data ?? []).map(mapFollow));
  }

  // ── Activity Feed ───────────────────────────────────────────────────

  /** Post a new activity. */
  async postActivity(input: CreateActivityInput): Promise<SocialResult<Activity>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_activities')
      .insert({
        profile_id: myProfile.data.id,
        module_id: input.moduleId,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        metadata: input.metadata ?? {},
        visibility: input.visibility ?? 'followers',
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(mapActivity(data));
  }

  /** Get the activity feed (activities from people the current user follows). */
  async getFeed(opts: {
    limit?: number;
    offset?: number;
    moduleId?: string;
  } = {}): Promise<SocialResult<Activity[]>> {
    const { limit = 50, offset = 0, moduleId } = opts;

    let query = this.supabase
      .from('social_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []).map(mapActivity));
  }

  /** Get activities for a specific profile. */
  async getProfileActivities(
    profileId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<SocialResult<Activity[]>> {
    const { limit = 50, offset = 0 } = opts;

    const { data, error } = await this.supabase
      .from('social_activities')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return err(error.message);
    return ok((data ?? []).map(mapActivity));
  }

  /** Delete an activity (own only, enforced by RLS). */
  async deleteActivity(activityId: string): Promise<SocialResult<void>> {
    const { error } = await this.supabase
      .from('social_activities')
      .delete()
      .eq('id', activityId);

    if (error) return err(error.message);
    return ok(undefined);
  }

  // ── Kudos ───────────────────────────────────────────────────────────

  /** Give kudos to an activity. */
  async giveKudos(activityId: string, emoji: KudosEmoji): Promise<SocialResult<Kudos>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_kudos')
      .insert({
        activity_id: activityId,
        giver_id: myProfile.data.id,
        emoji,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return err('Already gave kudos to this activity');
      return err(error.message);
    }
    return ok(mapKudos(data));
  }

  /** Remove kudos from an activity. */
  async removeKudos(activityId: string): Promise<SocialResult<void>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { error } = await this.supabase
      .from('social_kudos')
      .delete()
      .eq('activity_id', activityId)
      .eq('giver_id', myProfile.data.id);

    if (error) return err(error.message);
    return ok(undefined);
  }

  /** Get kudos for an activity. */
  async getActivityKudos(activityId: string): Promise<SocialResult<Kudos[]>> {
    const { data, error } = await this.supabase
      .from('social_kudos')
      .select('*')
      .eq('activity_id', activityId);

    if (error) return err(error.message);
    return ok((data ?? []).map(mapKudos));
  }

  // ── Comments ────────────────────────────────────────────────────────

  /** Add a comment to an activity. */
  async addComment(activityId: string, body: string): Promise<SocialResult<Comment>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_comments')
      .insert({
        activity_id: activityId,
        profile_id: myProfile.data.id,
        body,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(mapComment(data));
  }

  /** Get comments for an activity. */
  async getComments(
    activityId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<SocialResult<Comment[]>> {
    const { limit = 50, offset = 0 } = opts;

    const { data, error } = await this.supabase
      .from('social_comments')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return err(error.message);
    return ok((data ?? []).map(mapComment));
  }

  /** Delete a comment (own only, enforced by RLS). */
  async deleteComment(commentId: string): Promise<SocialResult<void>> {
    const { error } = await this.supabase
      .from('social_comments')
      .delete()
      .eq('id', commentId);

    if (error) return err(error.message);
    return ok(undefined);
  }

  // ── Challenges ──────────────────────────────────────────────────────

  /** Create a new challenge. */
  async createChallenge(input: CreateChallengeInput): Promise<SocialResult<Challenge>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    // Insert challenge
    const { data: challenge, error: challengeError } = await this.supabase
      .from('social_challenges')
      .insert({
        title: input.title,
        description: input.description ?? null,
        creator_id: myProfile.data.id,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        visibility: input.visibility ?? 'public',
      })
      .select()
      .single();

    if (challengeError) return err(challengeError.message);

    // Insert goals
    const goalInserts = input.goals.map((g) => ({
      challenge_id: challenge.id,
      module_id: g.moduleId,
      activity_type: g.activityType,
      target_count: g.targetCount,
      unit: g.unit,
      description: g.description,
    }));

    const { data: goals, error: goalsError } = await this.supabase
      .from('social_challenge_goals')
      .insert(goalInserts)
      .select();

    if (goalsError) return err(goalsError.message);

    // Auto-join the creator
    await this.supabase
      .from('social_challenge_members')
      .insert({
        challenge_id: challenge.id,
        profile_id: myProfile.data.id,
        status: 'joined',
        progress: {},
      });

    return ok(mapChallenge(challenge, goals ?? []));
  }

  /** Join a challenge. */
  async joinChallenge(challengeId: string): Promise<SocialResult<ChallengeMember>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_challenge_members')
      .insert({
        challenge_id: challengeId,
        profile_id: myProfile.data.id,
        status: 'joined',
        progress: {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return err('Already joined this challenge');
      return err(error.message);
    }
    return ok(mapChallengeMember(data));
  }

  /** Leave a challenge. */
  async leaveChallenge(challengeId: string): Promise<SocialResult<void>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { error } = await this.supabase
      .from('social_challenge_members')
      .update({ status: 'dropped' })
      .eq('challenge_id', challengeId)
      .eq('profile_id', myProfile.data.id);

    if (error) return err(error.message);
    return ok(undefined);
  }

  /** Get active challenges. */
  async getActiveChallenges(opts: { limit?: number; offset?: number } = {}): Promise<SocialResult<Challenge[]>> {
    const { limit = 20, offset = 0 } = opts;

    const { data: challenges, error } = await this.supabase
      .from('social_challenges')
      .select('*')
      .in('status', ['upcoming', 'active'])
      .order('starts_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return err(error.message);

    // Fetch goals for each challenge
    const challengeIds = (challenges ?? []).map((c: any) => c.id);
    const { data: goals } = await this.supabase
      .from('social_challenge_goals')
      .select('*')
      .in('challenge_id', challengeIds);

    const goalsByChallenge = new Map<string, any[]>();
    for (const goal of goals ?? []) {
      const existing = goalsByChallenge.get(goal.challenge_id) ?? [];
      existing.push(goal);
      goalsByChallenge.set(goal.challenge_id, existing);
    }

    return ok(
      (challenges ?? []).map((c: any) => mapChallenge(c, goalsByChallenge.get(c.id) ?? [])),
    );
  }

  /** Get challenge progress for the current user. */
  async getMyChallengeProgress(challengeId: string): Promise<SocialResult<ChallengeMember | null>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_challenge_members')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('profile_id', myProfile.data.id)
      .maybeSingle();

    if (error) return err(error.message);
    return ok(data ? mapChallengeMember(data) : null);
  }

  /** Update challenge progress (increment a goal counter). */
  async updateChallengeProgress(
    challengeId: string,
    goalId: string,
    increment: number = 1,
  ): Promise<SocialResult<ChallengeMember>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    // Get current progress
    const { data: member, error: fetchError } = await this.supabase
      .from('social_challenge_members')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('profile_id', myProfile.data.id)
      .single();

    if (fetchError) return err(fetchError.message);

    const progress = { ...(member.progress as Record<string, number>) };
    progress[goalId] = (progress[goalId] ?? 0) + increment;

    const { data, error } = await this.supabase
      .from('social_challenge_members')
      .update({ progress })
      .eq('id', member.id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(mapChallengeMember(data));
  }

  // ── Groups ──────────────────────────────────────────────────────────

  /** Create a group. */
  async createGroup(input: {
    name: string;
    description?: string;
    avatarUrl?: string;
    isPublic?: boolean;
  }): Promise<SocialResult<Group>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_groups')
      .insert({
        name: input.name,
        description: input.description ?? null,
        avatar_url: input.avatarUrl ?? null,
        creator_id: myProfile.data.id,
        is_public: input.isPublic ?? true,
      })
      .select()
      .single();

    if (error) return err(error.message);

    // Auto-add creator as owner
    await this.supabase
      .from('social_group_members')
      .insert({
        group_id: data.id,
        profile_id: myProfile.data.id,
        role: 'owner',
      });

    return ok(mapGroup(data));
  }

  /** Join a group. */
  async joinGroup(groupId: string): Promise<SocialResult<GroupMember>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_group_members')
      .insert({
        group_id: groupId,
        profile_id: myProfile.data.id,
        role: 'member',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return err('Already a member of this group');
      return err(error.message);
    }
    return ok(mapGroupMember(data));
  }

  /** Leave a group. */
  async leaveGroup(groupId: string): Promise<SocialResult<void>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { error } = await this.supabase
      .from('social_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('profile_id', myProfile.data.id);

    if (error) return err(error.message);
    return ok(undefined);
  }

  /** Get groups the current user belongs to. */
  async getMyGroups(): Promise<SocialResult<Group[]>> {
    const myProfile = await this.getMyProfile();
    if (!myProfile.ok) return err(myProfile.error);
    if (!myProfile.data) return err('You must create a profile first');

    const { data, error } = await this.supabase
      .from('social_group_members')
      .select('group:social_groups(*)')
      .eq('profile_id', myProfile.data.id);

    if (error) return err(error.message);
    return ok((data ?? []).map((row: any) => mapGroup(row.group)));
  }

  /** Discover public groups. */
  async discoverGroups(opts: { limit?: number; offset?: number } = {}): Promise<SocialResult<Group[]>> {
    const { limit = 20, offset = 0 } = opts;

    const { data, error } = await this.supabase
      .from('social_groups')
      .select('*')
      .eq('is_public', true)
      .order('member_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return err(error.message);
    return ok((data ?? []).map(mapGroup));
  }

  // ── Leaderboards ────────────────────────────────────────────────────

  /** Get leaderboard entries for a given config. */
  async getLeaderboard(
    configId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<SocialResult<LeaderboardEntry[]>> {
    const { limit = 50, offset = 0 } = opts;

    // Fetch the config to know scoring rules
    const { data: config, error: configError } = await this.supabase
      .from('social_leaderboard_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError) return err(configError.message);

    // Compute leaderboard via RPC (server-side function)
    // Falls back to client-side computation for now
    const { data, error } = await this.supabase
      .rpc('compute_leaderboard', {
        config_id: configId,
        result_limit: limit,
        result_offset: offset,
      });

    if (error) return err(error.message);
    return ok((data ?? []).map(mapLeaderboardEntry));
  }

  /** Get a friends-only leaderboard for the current user. */
  async getFriendsLeaderboard(
    timeframe: LeaderboardTimeframe = 'weekly',
    opts: { limit?: number } = {},
  ): Promise<SocialResult<LeaderboardEntry[]>> {
    const { limit = 50 } = opts;

    const { data, error } = await this.supabase
      .rpc('compute_friends_leaderboard', {
        p_timeframe: timeframe,
        result_limit: limit,
      });

    if (error) return err(error.message);
    return ok((data ?? []).map(mapLeaderboardEntry));
  }
}

// ── Row Mappers (snake_case DB -> camelCase TS) ────────────────────────

function mapProfile(row: any): SocialProfile {
  return {
    id: row.id,
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    privacySettings: row.privacy_settings,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    enabledModules: row.enabled_modules ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFollow(row: any): Follow {
  return {
    id: row.id,
    followerId: row.follower_id,
    followeeId: row.followee_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapActivity(row: any): Activity {
  return {
    id: row.id,
    profileId: row.profile_id,
    moduleId: row.module_id,
    type: row.type,
    title: row.title,
    description: row.description,
    metadata: row.metadata ?? {},
    visibility: row.visibility,
    kudosCount: row.kudos_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
  };
}

function mapKudos(row: any): Kudos {
  return {
    id: row.id,
    activityId: row.activity_id,
    giverId: row.giver_id,
    emoji: row.emoji,
    createdAt: row.created_at,
  };
}

function mapComment(row: any): Comment {
  return {
    id: row.id,
    activityId: row.activity_id,
    profileId: row.profile_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChallenge(row: any, goalRows: any[]): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    creatorId: row.creator_id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    goals: goalRows.map(mapChallengeGoal),
    memberCount: row.member_count,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChallengeGoal(row: any) {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    moduleId: row.module_id,
    activityType: row.activity_type,
    targetCount: row.target_count,
    unit: row.unit,
    description: row.description,
  };
}

function mapChallengeMember(row: any): ChallengeMember {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    profileId: row.profile_id,
    status: row.status,
    progress: row.progress ?? {},
    joinedAt: row.joined_at,
    completedAt: row.completed_at,
  };
}

function mapGroup(row: any): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    avatarUrl: row.avatar_url,
    creatorId: row.creator_id,
    memberCount: row.member_count,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGroupMember(row: any): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    profileId: row.profile_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapLeaderboardEntry(row: any): LeaderboardEntry {
  return {
    profileId: row.profile_id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    score: row.score,
    rank: row.rank,
    moduleScores: row.module_scores,
  };
}
