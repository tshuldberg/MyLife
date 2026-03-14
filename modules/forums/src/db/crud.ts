/**
 * Local SQLite CRUD operations for the forums cache.
 * These read/write from the local cache tables for offline support.
 * Write-through to Supabase happens via the cloud client.
 */

import type {
  Community,
  CommunityMember,
  Thread,
  Reply,
  Bookmark,
  Tag,
} from '../types';

/** Database adapter interface matching the hub's SQLite wrapper. */
export interface DatabaseAdapter {
  run(sql: string, params?: unknown[]): void;
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
}

const COMMUNITY_COLUMNS = [
  'id',
  'creator_id as creatorId',
  'name',
  'display_name as displayName',
  'description',
  'icon_url as iconUrl',
  'banner_url as bannerUrl',
  'community_type as communityType',
  'linked_module_id as linkedModuleId',
  'member_count as memberCount',
  'thread_count as threadCount',
  'created_at as createdAt',
  'updated_at as updatedAt',
].join(', ');

const MEMBER_COLUMNS = [
  'id',
  'community_id as communityId',
  'profile_id as profileId',
  'role',
  'status',
  'joined_at as joinedAt',
].join(', ');

const THREAD_COLUMNS = [
  'id',
  'community_id as communityId',
  'author_id as authorId',
  'title',
  'body',
  'status',
  'is_pinned as isPinned',
  'vote_score as voteScore',
  'reply_count as replyCount',
  'view_count as viewCount',
  'created_at as createdAt',
  'updated_at as updatedAt',
].join(', ');

const REPLY_COLUMNS = [
  'id',
  'thread_id as threadId',
  'parent_reply_id as parentReplyId',
  'author_id as authorId',
  'body',
  'vote_score as voteScore',
  'depth',
  'status',
  'created_at as createdAt',
  'updated_at as updatedAt',
].join(', ');

const BOOKMARK_COLUMNS = [
  'id',
  'profile_id as profileId',
  'thread_id as threadId',
  'created_at as createdAt',
].join(', ');

const TAG_COLUMNS = [
  'id',
  'community_id as communityId',
  'name',
  'color',
].join(', ');

function mapCachedThread(row: Thread & { isPinned: boolean | number }): Thread {
  return {
    ...row,
    isPinned: Boolean(row.isPinned),
  };
}

// ── Communities ──────────────────────────────────────────────────────

export function getCachedCommunities(
  db: DatabaseAdapter,
  options?: { type?: string; limit?: number; offset?: number },
): Community[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.type) {
    conditions.push('community_type = ?');
    params.push(options.type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit ? `LIMIT ${options.limit}` : 'LIMIT 50';
  const offset = options?.offset ? `OFFSET ${options.offset}` : '';

  return db.all<Community>(
    `SELECT ${COMMUNITY_COLUMNS} FROM fr_communities_cache ${where} ORDER BY member_count DESC ${limit} ${offset}`,
    params,
  );
}

export function getCachedCommunityById(db: DatabaseAdapter, id: string): Community | undefined {
  return db.get<Community>(`SELECT ${COMMUNITY_COLUMNS} FROM fr_communities_cache WHERE id = ?`, [id]);
}

export function getCachedCommunityByName(db: DatabaseAdapter, name: string): Community | undefined {
  return db.get<Community>(`SELECT ${COMMUNITY_COLUMNS} FROM fr_communities_cache WHERE name = ?`, [name]);
}

export function upsertCachedCommunity(db: DatabaseAdapter, community: Community): void {
  db.run(
    `INSERT OR REPLACE INTO fr_communities_cache
     (id, creator_id, name, display_name, description, icon_url, banner_url,
      community_type, linked_module_id, member_count, thread_count, created_at, updated_at, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      community.id, community.creatorId, community.name, community.displayName,
      community.description, community.iconUrl, community.bannerUrl, community.communityType,
      community.linkedModuleId, community.memberCount, community.threadCount,
      community.createdAt, community.updatedAt,
    ],
  );
}

// ── Community Members ───────────────────────────────────────────────

export function getCachedCommunityMembers(
  db: DatabaseAdapter,
  communityId: string,
): CommunityMember[] {
  return db.all<CommunityMember>(
    `SELECT ${MEMBER_COLUMNS} FROM fr_community_members_cache WHERE community_id = ? ORDER BY joined_at ASC`,
    [communityId],
  );
}

export function upsertCachedCommunityMember(db: DatabaseAdapter, member: CommunityMember): void {
  db.run(
    `INSERT OR REPLACE INTO fr_community_members_cache
     (id, community_id, profile_id, role, status, joined_at, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [member.id, member.communityId, member.profileId, member.role, member.status, member.joinedAt],
  );
}

// ── Threads ─────────────────────────────────────────────────────────

export function getCachedThreads(
  db: DatabaseAdapter,
  communityId: string,
  options?: { sort?: 'new' | 'hot' | 'top'; limit?: number; offset?: number },
): Thread[] {
  const orderBy = options?.sort === 'top'
    ? 'vote_score DESC'
    : options?.sort === 'hot'
      ? 'vote_score DESC, created_at DESC'
      : 'created_at DESC';
  const limit = options?.limit ? `LIMIT ${options.limit}` : 'LIMIT 50';
  const offset = options?.offset ? `OFFSET ${options.offset}` : '';

  return db
    .all<Thread & { isPinned: boolean | number }>(
      `SELECT ${THREAD_COLUMNS} FROM fr_threads_cache WHERE community_id = ? AND status = 'open'
     ORDER BY is_pinned DESC, ${orderBy} ${limit} ${offset}`,
      [communityId],
    )
    .map(mapCachedThread);
}

export function getCachedThreadById(db: DatabaseAdapter, id: string): Thread | undefined {
  const row = db.get<Thread & { isPinned: boolean | number }>(
    `SELECT ${THREAD_COLUMNS} FROM fr_threads_cache WHERE id = ?`,
    [id],
  );
  return row ? mapCachedThread(row) : undefined;
}

export function upsertCachedThread(db: DatabaseAdapter, thread: Thread): void {
  db.run(
    `INSERT OR REPLACE INTO fr_threads_cache
     (id, community_id, author_id, title, body, status, is_pinned,
      vote_score, reply_count, view_count, created_at, updated_at, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      thread.id, thread.communityId, thread.authorId, thread.title, thread.body,
      thread.status, thread.isPinned ? 1 : 0, thread.voteScore, thread.replyCount,
      thread.viewCount, thread.createdAt, thread.updatedAt,
    ],
  );
}

export function deleteCachedThread(db: DatabaseAdapter, id: string): void {
  db.run('DELETE FROM fr_threads_cache WHERE id = ?', [id]);
}

// ── Replies ─────────────────────────────────────────────────────────

export function getCachedReplies(
  db: DatabaseAdapter,
  threadId: string,
  options?: { parentReplyId?: string | null; limit?: number },
): Reply[] {
  if (options?.parentReplyId) {
    return db.all<Reply>(
      `SELECT ${REPLY_COLUMNS} FROM fr_replies_cache WHERE thread_id = ? AND parent_reply_id = ? AND status = 'open'
       ORDER BY vote_score DESC, created_at ASC LIMIT ?`,
      [threadId, options.parentReplyId, options?.limit ?? 50],
    );
  }
  return db.all<Reply>(
    `SELECT ${REPLY_COLUMNS} FROM fr_replies_cache WHERE thread_id = ? AND parent_reply_id IS NULL AND status = 'open'
     ORDER BY vote_score DESC, created_at ASC LIMIT ?`,
    [threadId, options?.limit ?? 50],
  );
}

export function upsertCachedReply(db: DatabaseAdapter, reply: Reply): void {
  db.run(
    `INSERT OR REPLACE INTO fr_replies_cache
     (id, thread_id, parent_reply_id, author_id, body, vote_score, depth, status, created_at, updated_at, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      reply.id, reply.threadId, reply.parentReplyId, reply.authorId, reply.body,
      reply.voteScore, reply.depth, reply.status, reply.createdAt, reply.updatedAt,
    ],
  );
}

// ── Bookmarks ───────────────────────────────────────────────────────

export function getCachedBookmarks(db: DatabaseAdapter, profileId: string): Bookmark[] {
  return db.all<Bookmark>(
    `SELECT ${BOOKMARK_COLUMNS} FROM fr_bookmarks_cache WHERE profile_id = ? ORDER BY created_at DESC`,
    [profileId],
  );
}

export function upsertCachedBookmark(db: DatabaseAdapter, bookmark: Bookmark): void {
  db.run(
    `INSERT OR REPLACE INTO fr_bookmarks_cache (id, profile_id, thread_id, created_at, cached_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [bookmark.id, bookmark.profileId, bookmark.threadId, bookmark.createdAt],
  );
}

export function deleteCachedBookmark(db: DatabaseAdapter, id: string): void {
  db.run('DELETE FROM fr_bookmarks_cache WHERE id = ?', [id]);
}

// ── Tags ────────────────────────────────────────────────────────────

export function getCachedTags(db: DatabaseAdapter, communityId: string): Tag[] {
  return db.all<Tag>(
    `SELECT ${TAG_COLUMNS} FROM fr_tags_cache WHERE community_id = ? ORDER BY name ASC`,
    [communityId],
  );
}

export function upsertCachedTag(db: DatabaseAdapter, tag: Tag): void {
  db.run(
    `INSERT OR REPLACE INTO fr_tags_cache (id, community_id, name, color, cached_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [tag.id, tag.communityId, tag.name, tag.color],
  );
}
