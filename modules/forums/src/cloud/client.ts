/**
 * Supabase cloud client for MyForums.
 * All functions accept a SupabaseClient as the first parameter for dependency injection.
 * Returns Result<T> for consistent error handling.
 */

import {
  emitForumCommunityCreated,
  emitForumReplyPosted,
  emitForumThreadCreated,
} from '@mylife/social';
import type {
  Community,
  CreateCommunityInput,
  CommunityMember,
  Thread,
  CreateThreadInput,
  Reply,
  CreateReplyInput,
  Vote,
  VoteDirection,
  VoteTargetType,
  Bookmark,
  UserStats,
  ModAction,
  ForumReport,
  CommunityRule,
  Tag,
} from '../types';

/** Minimal Supabase client interface for dependency injection. */
interface SupabaseClient {
  from(table: string): SupabaseQueryBuilder;
  rpc(fn: string, params?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
  auth: { getUser(): PromiseLike<{ data: { user: { id: string } | null } }> };
}

interface SupabaseQueryBuilder {
  select(columns?: string): SupabaseQueryBuilder;
  insert(data: Record<string, unknown>): SupabaseQueryBuilder;
  update(data: Record<string, unknown>): SupabaseQueryBuilder;
  delete(): SupabaseQueryBuilder;
  eq(column: string, value: unknown): SupabaseQueryBuilder;
  neq(column: string, value: unknown): SupabaseQueryBuilder;
  in(column: string, values: unknown[]): SupabaseQueryBuilder;
  is(column: string, value: null): SupabaseQueryBuilder;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder;
  limit(count: number): SupabaseQueryBuilder;
  range(from: number, to: number): SupabaseQueryBuilder;
  textSearch(column: string, query: string): SupabaseQueryBuilder;
  single(): PromiseLike<{ data: unknown; error: unknown }>;
  then(resolve: (value: { data: unknown; error: unknown }) => void): void;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

interface ForumCommunityRow {
  id: string;
  creator_id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  community_type: Community['communityType'];
  linked_module_id: string | null;
  member_count: number;
  thread_count: number;
  created_at: string;
  updated_at: string;
}

interface ForumCommunityMemberRow {
  id: string;
  community_id: string;
  profile_id: string;
  role: CommunityMember['role'];
  status: CommunityMember['status'];
  joined_at: string;
}

interface ForumThreadRow {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  body: string;
  status: Thread['status'];
  is_pinned: boolean;
  vote_score: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface ForumReplyRow {
  id: string;
  thread_id: string;
  parent_reply_id: string | null;
  author_id: string;
  body: string;
  vote_score: number;
  depth: number;
  status: Reply['status'];
  created_at: string;
  updated_at: string;
}

interface ForumVoteRow {
  id: string;
  profile_id: string;
  target_type: Vote['targetType'];
  target_id: string;
  direction: Vote['direction'];
  created_at: string;
}

interface ForumBookmarkRow {
  id: string;
  profile_id: string;
  thread_id: string;
  created_at: string;
}

interface ForumUserStatsRow {
  profile_id: string;
  thread_count: number;
  reply_count: number;
  karma: number;
  communities_joined: number;
}

interface ForumModActionRow {
  id: string;
  community_id: string;
  moderator_id: string;
  action_type: ModAction['actionType'];
  target_id: string | null;
  reason: string | null;
  created_at: string;
}

interface ForumReportRow {
  id: string;
  reporter_id: string;
  community_id: string;
  target_type: ForumReport['targetType'];
  target_id: string;
  reason: ForumReport['reason'];
  details: string | null;
  created_at: string;
}

interface ForumRuleRow {
  id: string;
  community_id: string;
  title: string;
  description: string;
  position: number;
}

interface ForumTagRow {
  id: string;
  community_id: string;
  name: string;
  color: string | null;
}

function mapCommunityRow(row: ForumCommunityRow): Community {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    iconUrl: row.icon_url,
    bannerUrl: row.banner_url,
    communityType: row.community_type,
    linkedModuleId: row.linked_module_id,
    memberCount: row.member_count,
    threadCount: row.thread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCommunityMemberRow(row: ForumCommunityMemberRow): CommunityMember {
  return {
    id: row.id,
    communityId: row.community_id,
    profileId: row.profile_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

function mapThreadRow(row: ForumThreadRow): Thread {
  return {
    id: row.id,
    communityId: row.community_id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    status: row.status,
    isPinned: row.is_pinned,
    voteScore: row.vote_score,
    replyCount: row.reply_count,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReplyRow(row: ForumReplyRow): Reply {
  return {
    id: row.id,
    threadId: row.thread_id,
    parentReplyId: row.parent_reply_id,
    authorId: row.author_id,
    body: row.body,
    voteScore: row.vote_score,
    depth: row.depth,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVoteRow(row: ForumVoteRow): Vote {
  return {
    id: row.id,
    profileId: row.profile_id,
    targetType: row.target_type,
    targetId: row.target_id,
    direction: row.direction,
    createdAt: row.created_at,
  };
}

function mapBookmarkRow(row: ForumBookmarkRow): Bookmark {
  return {
    id: row.id,
    profileId: row.profile_id,
    threadId: row.thread_id,
    createdAt: row.created_at,
  };
}

function mapUserStatsRow(row: ForumUserStatsRow): UserStats {
  return {
    profileId: row.profile_id,
    threadCount: row.thread_count,
    replyCount: row.reply_count,
    karma: row.karma,
    communitiesJoined: row.communities_joined,
  };
}

function mapModActionRow(row: ForumModActionRow): ModAction {
  return {
    id: row.id,
    communityId: row.community_id,
    moderatorId: row.moderator_id,
    actionType: row.action_type,
    targetId: row.target_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function mapForumReportRow(row: ForumReportRow): ForumReport {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    communityId: row.community_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    createdAt: row.created_at,
  };
}

function mapRuleRow(row: ForumRuleRow): CommunityRule {
  return {
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    description: row.description,
    position: row.position,
  };
}

function mapTagRow(row: ForumTagRow): Tag {
  return {
    id: row.id,
    communityId: row.community_id,
    name: row.name,
    color: row.color,
  };
}

function toCommunityInsert(input: CreateCommunityInput, creatorId: string): Record<string, unknown> {
  return {
    creator_id: creatorId,
    name: input.name,
    display_name: input.displayName,
    description: input.description ?? null,
    community_type: input.communityType ?? 'public',
    linked_module_id: input.linkedModuleId ?? null,
  };
}

function toThreadInsert(input: CreateThreadInput, authorId: string): Record<string, unknown> {
  return {
    community_id: input.communityId,
    author_id: authorId,
    title: input.title,
    body: input.body,
  };
}

function toReportInsert(
  report: Omit<ForumReport, 'id' | 'reporterId' | 'createdAt'>,
  reporterId: string,
): Record<string, unknown> {
  return {
    reporter_id: reporterId,
    community_id: report.communityId,
    target_type: report.targetType,
    target_id: report.targetId,
    reason: report.reason,
    details: report.details ?? null,
  };
}

// ── Communities ──────────────────────────────────────────────────────

export async function cloudGetCommunities(
  supabase: SupabaseClient,
  options?: { limit?: number; offset?: number },
): Promise<Result<Community[]>> {
  let query = supabase
    .from('fr_communities')
    .select('*')
    .order('member_count', { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumCommunityRow[] | null ?? []).map(mapCommunityRow) };
}

export async function cloudGetCommunityById(
  supabase: SupabaseClient,
  id: string,
): Promise<Result<Community>> {
  const { data, error } = await supabase
    .from('fr_communities')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapCommunityRow(data as ForumCommunityRow) };
}

export async function cloudGetCommunityByName(
  supabase: SupabaseClient,
  name: string,
): Promise<Result<Community>> {
  const { data, error } = await supabase
    .from('fr_communities')
    .select('*')
    .eq('name', name)
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapCommunityRow(data as ForumCommunityRow) };
}

export async function cloudCreateCommunity(
  supabase: SupabaseClient,
  input: CreateCommunityInput,
): Promise<Result<Community>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('fr_communities')
    .insert(toCommunityInsert(input, user.id))
    .select('*')
    .single();
  if (error) return { ok: false, error: String(error) };

  const community = mapCommunityRow(data as ForumCommunityRow);
  void emitForumCommunityCreated(`Created ${community.displayName}`, {
    communityName: community.displayName,
    description: community.description ?? undefined,
  });

  return { ok: true, data: community };
}

export async function cloudSearchCommunities(
  supabase: SupabaseClient,
  query: string,
): Promise<Result<Community[]>> {
  const { data, error } = await supabase
    .from('fr_communities')
    .select('*')
    .textSearch('search_vector', query)
    .order('member_count', { ascending: false })
    .limit(50);
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumCommunityRow[] | null ?? []).map(mapCommunityRow) };
}

// ── Community Members ───────────────────────────────────────────────

export async function cloudJoinCommunity(
  supabase: SupabaseClient,
  communityId: string,
): Promise<Result<CommunityMember>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('fr_community_members')
    .insert({ community_id: communityId, profile_id: user.id })
    .select('*')
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapCommunityMemberRow(data as ForumCommunityMemberRow) };
}

export async function cloudLeaveCommunity(
  supabase: SupabaseClient,
  communityId: string,
): Promise<Result<{ left: boolean }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('fr_community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', user.id);
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: { left: true } };
}

// ── Threads ─────────────────────────────────────────────────────────

export async function cloudGetThreads(
  supabase: SupabaseClient,
  communityId: string,
  options?: { sort?: 'new' | 'hot' | 'top'; limit?: number },
): Promise<Result<Thread[]>> {
  const orderCol = options?.sort === 'top' ? 'vote_score' : 'created_at';
  let query = supabase
    .from('fr_threads')
    .select('*')
    .eq('community_id', communityId)
    .neq('status', 'removed')
    .order('is_pinned', { ascending: false })
    .order(orderCol, { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumThreadRow[] | null ?? []).map(mapThreadRow) };
}

export async function cloudGetThreadById(
  supabase: SupabaseClient,
  id: string,
): Promise<Result<Thread>> {
  const { data, error } = await supabase
    .from('fr_threads')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapThreadRow(data as ForumThreadRow) };
}

export async function cloudCreateThread(
  supabase: SupabaseClient,
  input: CreateThreadInput,
): Promise<Result<Thread>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('fr_threads')
    .insert(toThreadInsert(input, user.id))
    .select('*')
    .single();
  if (error) return { ok: false, error: String(error) };

  const thread = mapThreadRow(data as ForumThreadRow);
  const communityResult = await cloudGetCommunityById(supabase, input.communityId);
  const communityName = communityResult.ok ? communityResult.data.displayName : input.communityId;
  void emitForumThreadCreated(`Started a discussion in ${communityName}`, {
    communityName,
    threadTitle: thread.title,
  });

  return { ok: true, data: thread };
}

export async function cloudSearchThreads(
  supabase: SupabaseClient,
  query: string,
): Promise<Result<Thread[]>> {
  const { data, error } = await supabase
    .from('fr_threads')
    .select('*')
    .textSearch('search_vector', query)
    .neq('status', 'removed')
    .order('vote_score', { ascending: false })
    .limit(50);
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumThreadRow[] | null ?? []).map(mapThreadRow) };
}

// ── Replies ─────────────────────────────────────────────────────────

export async function cloudGetReplies(
  supabase: SupabaseClient,
  threadId: string,
  options?: { parentReplyId?: string | null; limit?: number },
): Promise<Result<Reply[]>> {
  let query = supabase
    .from('fr_replies')
    .select('*')
    .eq('thread_id', threadId)
    .neq('status', 'removed')
    .order('vote_score', { ascending: false });

  if (options?.parentReplyId) {
    query = query.eq('parent_reply_id', options.parentReplyId);
  } else if (options?.parentReplyId === null) {
    query = query.is('parent_reply_id', null);
  }

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumReplyRow[] | null ?? []).map(mapReplyRow) };
}

export async function cloudCreateReply(
  supabase: SupabaseClient,
  input: CreateReplyInput & { depth?: number },
): Promise<Result<Reply>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('fr_replies')
    .insert({
      thread_id: input.threadId,
      parent_reply_id: input.parentReplyId ?? null,
      author_id: user.id,
      body: input.body,
      depth: input.depth ?? 0,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: String(error) };

  const reply = mapReplyRow(data as ForumReplyRow);
  const threadResult = await cloudGetThreadById(supabase, input.threadId);
  if (threadResult.ok) {
    const communityResult = await cloudGetCommunityById(supabase, threadResult.data.communityId);
    const communityName = communityResult.ok ? communityResult.data.displayName : threadResult.data.communityId;
    void emitForumReplyPosted(`Replied in ${communityName}`, {
      communityName,
      threadTitle: threadResult.data.title,
      replyPreview: reply.body.slice(0, 120),
    });
  }

  return { ok: true, data: reply };
}

// ── Votes ───────────────────────────────────────────────────────────

export async function cloudCastVote(
  supabase: SupabaseClient,
  targetType: VoteTargetType,
  targetId: string,
  direction: VoteDirection,
): Promise<Result<Vote>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  // Upsert: remove existing vote first, then insert
  await supabase
    .from('fr_votes')
    .delete()
    .eq('profile_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  const { data, error } = await supabase
    .from('fr_votes')
    .insert({
      profile_id: user.id,
      target_type: targetType,
      target_id: targetId,
      direction,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapVoteRow(data as ForumVoteRow) };
}

export async function cloudRemoveVote(
  supabase: SupabaseClient,
  targetType: VoteTargetType,
  targetId: string,
): Promise<Result<{ removed: boolean }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('fr_votes')
    .delete()
    .eq('profile_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: { removed: true } };
}

// ── Bookmarks ───────────────────────────────────────────────────────

export async function cloudGetBookmarks(
  supabase: SupabaseClient,
): Promise<Result<Bookmark[]>> {
  const { data, error } = await supabase
    .from('fr_bookmarks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumBookmarkRow[] | null ?? []).map(mapBookmarkRow) };
}

export async function cloudToggleBookmark(
  supabase: SupabaseClient,
  threadId: string,
): Promise<Result<{ bookmarked: boolean }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('fr_bookmarks')
    .select('id')
    .eq('profile_id', user.id)
    .eq('thread_id', threadId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('fr_bookmarks')
      .delete()
      .eq('id', (existing as { id: string }).id);
    if (error) return { ok: false, error: String(error) };
    return { ok: true, data: { bookmarked: false } };
  } else {
    const { error } = await supabase
      .from('fr_bookmarks')
      .insert({ profile_id: user.id, thread_id: threadId });
    if (error) return { ok: false, error: String(error) };
    return { ok: true, data: { bookmarked: true } };
  }
}

// ── User Stats ──────────────────────────────────────────────────────

export async function cloudGetUserStats(
  supabase: SupabaseClient,
  profileId: string,
): Promise<Result<UserStats>> {
  const { data, error } = await supabase
    .from('fr_user_stats')
    .select('*')
    .eq('profile_id', profileId)
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapUserStatsRow(data as ForumUserStatsRow) };
}

// ── Moderation ──────────────────────────────────────────────────────

export async function cloudGetModLog(
  supabase: SupabaseClient,
  communityId: string,
  options?: { limit?: number },
): Promise<Result<ModAction[]>> {
  let query = supabase
    .from('fr_mod_actions')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumModActionRow[] | null ?? []).map(mapModActionRow) };
}

// ── Reports ─────────────────────────────────────────────────────────

export async function cloudCreateReport(
  supabase: SupabaseClient,
  report: Omit<ForumReport, 'id' | 'reporterId' | 'createdAt'>,
): Promise<Result<ForumReport>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('fr_reports')
    .insert(toReportInsert(report, user.id))
    .select('*')
    .single();
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: mapForumReportRow(data as ForumReportRow) };
}

// ── Community Rules ─────────────────────────────────────────────────

export async function cloudGetCommunityRules(
  supabase: SupabaseClient,
  communityId: string,
): Promise<Result<CommunityRule[]>> {
  const { data, error } = await supabase
    .from('fr_community_rules')
    .select('*')
    .eq('community_id', communityId)
    .order('position', { ascending: true });
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumRuleRow[] | null ?? []).map(mapRuleRow) };
}

// ── Tags ────────────────────────────────────────────────────────────

export async function cloudGetTags(
  supabase: SupabaseClient,
  communityId: string,
): Promise<Result<Tag[]>> {
  const { data, error } = await supabase
    .from('fr_tags')
    .select('*')
    .eq('community_id', communityId)
    .order('name', { ascending: true });
  if (error) return { ok: false, error: String(error) };
  return { ok: true, data: (data as ForumTagRow[] | null ?? []).map(mapTagRow) };
}
