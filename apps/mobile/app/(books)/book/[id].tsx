import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Text, BookCover, StarRating, ShelfBadge, TagPill, Button, Card,
  colors, spacing,
} from '@mylife/ui';
import { ProgressSlider } from '../../../components/books/ProgressSlider';
import { useBook } from '../../../hooks/books/use-books';
import { useSessions } from '../../../hooks/books/use-sessions';
import { useReviewForBook } from '../../../hooks/books/use-reviews';
import { useBookTags } from '../../../hooks/books/use-tags';
import { useDatabase } from '../../../components/DatabaseProvider';
import {
  deleteBook,
  createShareEvent,
  listShareEventsVisibleToUser,
  type ShareObjectType,
  type ShareVisibility,
} from '@mylife/books';
import {
  createFriendInvite,
  listIncomingFriendInvites,
  listOutgoingFriendInvites,
  listFriendsForUser,
  acceptFriendInvite,
  declineFriendInvite,
  revokeFriendInvite,
  getPreference,
  setPreference,
  deletePreference,
  type FriendInvite,
  type FriendConnection,
  type FriendMessage,
  type FriendInboxItem,
} from '@mylife/db';
import {
  queueOutgoingFriendMessage,
  runFriendMessageSyncCycle,
  listLocalFriendConversation,
  listLocalFriendInbox,
  markFriendMessageReadWithSync,
} from '../../../lib/friend-messages';
import { callSyncEndpoint } from '../../../lib/sync-adapter';

const BOOKS_ACCENT = colors.modules.books;
const SOCIAL_ACTOR_ID_KEY = 'social.actor_user_id';
const SOCIAL_ACTOR_TOKEN_KEY = 'social.actor_token';

function parseAuthors(authors: string): string[] {
  try { return JSON.parse(authors); } catch { return [authors]; }
}

function parsePayloadJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function createLocalId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function parseOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeInvite(raw: unknown): FriendInvite | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = raw as Record<string, unknown>;
  const id = parseOptionalString(row.id);
  const fromUserId = parseOptionalString(row.from_user_id) ?? parseOptionalString(row.fromUserId);
  const toUserId = parseOptionalString(row.to_user_id) ?? parseOptionalString(row.toUserId);
  const status = parseOptionalString(row.status);
  const createdAt = parseOptionalString(row.created_at) ?? parseOptionalString(row.createdAt);
  const updatedAt = parseOptionalString(row.updated_at) ?? parseOptionalString(row.updatedAt) ?? createdAt;

  if (!id || !fromUserId || !toUserId || !status || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: status as FriendInvite['status'],
    message: parseOptionalString(row.message),
    created_at: createdAt,
    updated_at: updatedAt,
    responded_at: parseOptionalString(row.responded_at) ?? parseOptionalString(row.respondedAt),
  };
}

function normalizeFriend(raw: unknown): FriendConnection | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = raw as Record<string, unknown>;
  const userId = parseOptionalString(row.user_id) ?? parseOptionalString(row.userId);
  const friendUserId = parseOptionalString(row.friend_user_id) ?? parseOptionalString(row.friendUserId);
  const status = parseOptionalString(row.status);
  const createdAt = parseOptionalString(row.created_at) ?? parseOptionalString(row.createdAt);
  const updatedAt = parseOptionalString(row.updated_at) ?? parseOptionalString(row.updatedAt) ?? createdAt;
  if (!userId || !friendUserId || !status || !createdAt || !updatedAt) {
    return null;
  }

  return {
    user_id: userId,
    friend_user_id: friendUserId,
    status: status as FriendConnection['status'],
    source_invite_id: parseOptionalString(row.source_invite_id) ?? parseOptionalString(row.sourceInviteId),
    created_at: createdAt,
    updated_at: updatedAt,
    display_name: parseOptionalString(row.display_name) ?? parseOptionalString(row.displayName),
    handle: parseOptionalString(row.handle),
    avatar_url: parseOptionalString(row.avatar_url) ?? parseOptionalString(row.avatarUrl),
  };
}

function normalizeShareEvent(raw: unknown): {
  id: string;
  actor_user_id: string;
  visibility: ShareVisibility;
  object_type: ShareObjectType;
  payload_json: string;
  created_at: string;
} | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = raw as Record<string, unknown>;
  const id = parseOptionalString(row.id);
  const actorUserId = parseOptionalString(row.actor_user_id) ?? parseOptionalString(row.actorUserId);
  const objectType = parseOptionalString(row.object_type) ?? parseOptionalString(row.objectType);
  const objectId = parseOptionalString(row.object_id) ?? parseOptionalString(row.objectId);
  const visibility = parseOptionalString(row.visibility);
  const createdAt = parseOptionalString(row.created_at) ?? parseOptionalString(row.createdAt);

  if (!id || !actorUserId || !objectType || !objectId || !visibility || !createdAt) {
    return null;
  }

  const payload = row.payload_json ?? row.payload ?? {};
  const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return {
    id,
    actor_user_id: actorUserId,
    object_type: objectType as ShareObjectType,
    visibility: visibility as ShareVisibility,
    payload_json: payloadJson,
    created_at: createdAt,
  };
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();

  const { book } = useBook(id);
  const { sessions, updateProgress } = useSessions(id);
  const { review, save: saveReview } = useReviewForBook(id);
  const { tags } = useBookTags(id);

  const session = sessions.length > 0 ? sessions[0] : undefined;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [actorUserId, setActorUserId] = useState('demo-alice');
  const [actorToken, setActorToken] = useState<string | null>(null);
  const [inviteToUserId, setInviteToUserId] = useState('demo-bob');
  const [inviteMessage, setInviteMessage] = useState('');
  const [shareVisibility, setShareVisibility] = useState<ShareVisibility>('friends');
  const [shareTargetUserId, setShareTargetUserId] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [incomingInvites, setIncomingInvites] = useState<FriendInvite[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<FriendInvite[]>([]);
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [shareEvents, setShareEvents] = useState<Array<{
    id: string;
    actor_user_id: string;
    visibility: ShareVisibility;
    object_type: ShareObjectType;
    payload_json: string;
    created_at: string;
  }>>([]);
  const [messageTargetUserId, setMessageTargetUserId] = useState('demo-bob');
  const [messageDraft, setMessageDraft] = useState('');
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [messageInbox, setMessageInbox] = useState<FriendInboxItem[]>([]);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = parseOptionalString(getPreference(db, SOCIAL_ACTOR_ID_KEY));
    const storedToken = parseOptionalString(getPreference(db, SOCIAL_ACTOR_TOKEN_KEY));

    if (storedUserId) {
      setActorUserId(storedUserId);
    }
    if (storedToken) {
      setActorToken(storedToken);
    }
  }, [db]);

  const ensureActorIdentity = useCallback(async (userId: string): Promise<string | null> => {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      deletePreference(db, SOCIAL_ACTOR_ID_KEY);
      deletePreference(db, SOCIAL_ACTOR_TOKEN_KEY);
      setActorToken(null);
      return null;
    }

    const storedUserId = parseOptionalString(getPreference(db, SOCIAL_ACTOR_ID_KEY));
    const storedToken = parseOptionalString(getPreference(db, SOCIAL_ACTOR_TOKEN_KEY));
    if (storedUserId === trimmedUserId && storedToken) {
      setActorToken(storedToken);
      return storedToken;
    }

    setPreference(db, SOCIAL_ACTOR_ID_KEY, trimmedUserId);

    try {
      const issued = await callSyncEndpoint<{ actorToken?: unknown }>(db, {
        path: 'identity/actor/issue',
        method: 'POST',
        body: { userId: trimmedUserId },
        fallback: () => ({}),
      });
      const token = parseOptionalString(issued.actorToken);
      if (token) {
        setPreference(db, SOCIAL_ACTOR_TOKEN_KEY, token);
        setActorToken(token);
        return token;
      }
    } catch {
      // Ignore token issuance failures. Legacy userId fallback may still be enabled.
    }

    deletePreference(db, SOCIAL_ACTOR_TOKEN_KEY);
    setActorToken(null);
    return null;
  }, [db]);

  const loadSocialState = useCallback(async (
    viewerUserId: string,
    viewerToken: string | null,
  ): Promise<string> => {
    if (!viewerUserId) {
      setIncomingInvites([]);
      setOutgoingInvites([]);
      setFriends([]);
      setShareEvents([]);
      setMessageTargetUserId('');
      setMessages([]);
      setMessageInbox([]);
      return '';
    }

    try {
      const [invitesRaw, friendsRaw, shareRaw] = await Promise.all([
        callSyncEndpoint<unknown>(db, {
          path: 'friends/invites',
          method: 'GET',
          query: {
            userId: viewerUserId,
            actorToken: viewerToken ?? undefined,
            direction: 'both',
            status: 'pending,accepted,declined,revoked',
          },
          fallback: () => ({
            incoming: listIncomingFriendInvites(db, viewerUserId, ['pending', 'accepted', 'declined', 'revoked']),
            outgoing: listOutgoingFriendInvites(db, viewerUserId, ['pending', 'accepted', 'declined', 'revoked']),
          }),
        }),
        callSyncEndpoint<unknown>(db, {
          path: 'friends',
          method: 'GET',
          query: {
            userId: viewerUserId,
            actorToken: viewerToken ?? undefined,
          },
          fallback: () => ({
            friends: listFriendsForUser(db, viewerUserId),
          }),
        }),
        id
          ? callSyncEndpoint<unknown>(db, {
            path: 'share/events',
            method: 'GET',
            query: {
              viewerUserId,
              viewerToken: viewerToken ?? undefined,
              objectId: id,
              limit: 20,
            },
            fallback: () => ({
              items: listShareEventsVisibleToUser(db, {
                viewer_user_id: viewerUserId,
                object_id: id,
                limit: 20,
              }),
            }),
          })
          : Promise.resolve({ items: [] }),
      ]);

      const incoming = (
        typeof invitesRaw === 'object'
        && invitesRaw !== null
        && Array.isArray((invitesRaw as { incoming?: unknown[] }).incoming)
      )
        ? (invitesRaw as { incoming: unknown[] }).incoming
        : [];
      const outgoing = (
        typeof invitesRaw === 'object'
        && invitesRaw !== null
        && Array.isArray((invitesRaw as { outgoing?: unknown[] }).outgoing)
      )
        ? (invitesRaw as { outgoing: unknown[] }).outgoing
        : [];
      const friendsList = (
        typeof friendsRaw === 'object'
        && friendsRaw !== null
        && Array.isArray((friendsRaw as { friends?: unknown[] }).friends)
      )
        ? (friendsRaw as { friends: unknown[] }).friends
        : Array.isArray(friendsRaw)
          ? friendsRaw
          : [];
      const shareItems = (
        typeof shareRaw === 'object'
        && shareRaw !== null
        && Array.isArray((shareRaw as { items?: unknown[] }).items)
      )
        ? (shareRaw as { items: unknown[] }).items
        : Array.isArray(shareRaw)
          ? shareRaw
          : [];

      setIncomingInvites(
        incoming
          .map((item) => normalizeInvite(item))
          .filter((item): item is FriendInvite => item !== null),
      );
      setOutgoingInvites(
        outgoing
          .map((item) => normalizeInvite(item))
          .filter((item): item is FriendInvite => item !== null),
      );
      const normalizedFriends = friendsList
        .map((item) => normalizeFriend(item))
        .filter((item): item is FriendConnection => item !== null);
      setFriends(normalizedFriends);

      let resolvedTarget = '';
      setMessageTargetUserId((current) => {
        const currentTarget = current.trim();
        resolvedTarget =
          currentTarget.length > 0
          && normalizedFriends.some((friend) => friend.friend_user_id === currentTarget)
            ? currentTarget
            : (normalizedFriends[0]?.friend_user_id ?? currentTarget);
        return resolvedTarget;
      });

      setShareEvents(
        shareItems
          .map((item) => normalizeShareEvent(item))
          .filter((item): item is NonNullable<typeof item> => item !== null),
      );
      return resolvedTarget;
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to load sharing data.');
      return '';
    }
  }, [db, id]);

  const loadMessageState = useCallback(async (
    viewerUserId: string,
    friendUserId: string,
    viewerToken: string | null,
    syncFirst: boolean,
  ) => {
    if (!viewerUserId) {
      setMessageInbox([]);
      setMessages([]);
      return;
    }

    if (syncFirst) {
      setIsSyncingMessages(true);
    }

    try {
      if (syncFirst) {
        await runFriendMessageSyncCycle(db, viewerUserId, {
          actorToken: viewerToken ?? undefined,
        });
      }

      const inboxRows = listLocalFriendInbox(db, viewerUserId, 50);
      setMessageInbox(inboxRows);

      const trimmedFriend = friendUserId.trim();
      const fallbackFriend = inboxRows[0]?.friend_user_id ?? '';
      const resolvedFriend = trimmedFriend.length > 0 ? trimmedFriend : fallbackFriend;
      if (resolvedFriend && resolvedFriend !== trimmedFriend) {
        setMessageTargetUserId(resolvedFriend);
      }

      setMessages(
        resolvedFriend
          ? listLocalFriendConversation(db, viewerUserId, resolvedFriend, { limit: 120 })
          : [],
      );
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to load message data.');
    } finally {
      if (syncFirst) {
        setIsSyncingMessages(false);
      }
    }
  }, [db]);

  useEffect(() => {
    setRating(review?.rating ?? 0);
    setReviewText(review?.review_text ?? '');
  }, [review]);

  useEffect(() => {
    const viewerUserId = actorUserId.trim();
    void (async () => {
      const viewerToken = await ensureActorIdentity(viewerUserId);
      const targetUserId = await loadSocialState(viewerUserId, viewerToken);
      await loadMessageState(viewerUserId, targetUserId, viewerToken, true);
    })();
  }, [actorUserId, ensureActorIdentity, loadMessageState, loadSocialState]);

  const handleRatingChange = useCallback(
    (newRating: number) => {
      setRating(newRating);
      saveReview({ rating: newRating, review_text: reviewText || undefined });
    },
    [saveReview, reviewText],
  );

  const handleReviewBlur = useCallback(() => {
    if (reviewText !== (review?.review_text ?? '')) {
      saveReview({ rating: rating || undefined, review_text: reviewText || undefined });
    }
  }, [saveReview, reviewText, rating, review]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (session) {
        updateProgress(session.id, page);
      }
    },
    [session, updateProgress],
  );

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Delete Book',
      'Remove this book from your library? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBook(db, id);
            router.back();
          },
        },
      ],
    );
  }, [db, id, router]);

  const handleShare = useCallback(async () => {
    if (!id || !book) {
      setSocialError('Book ID is missing.');
      return;
    }

    const userId = actorUserId.trim();
    if (!userId) {
      setSocialError('Enter your user ID to share.');
      return;
    }

    setSocialError(null);
    setSocialNotice(null);

    const objectType: ShareObjectType =
      reviewText.trim().length > 0
        ? 'book_review'
        : rating > 0
          ? 'book_rating'
          : 'generic';

    const payload: Record<string, unknown> = {
      title: book.title,
      authors: parseAuthors(book.authors),
    };

    if (rating > 0) payload.rating = rating;
    if (reviewText.trim().length > 0) payload.reviewText = reviewText.trim();
    if (shareNote.trim().length > 0) payload.note = shareNote.trim();
    if (shareTargetUserId.trim().length > 0) payload.targetUserId = shareTargetUserId.trim();

    try {
      const issuedToken = await ensureActorIdentity(userId);
      const eventId = createLocalId();
      await callSyncEndpoint(db, {
        path: 'share/events',
        method: 'POST',
        headers: issuedToken
          ? {
              'x-actor-identity-token': issuedToken,
            }
          : undefined,
        body: {
          id: eventId,
          actorToken: issuedToken ?? undefined,
          actorUserId: userId,
          objectType: objectType,
          objectId: id,
          visibility: shareVisibility,
          payload,
        },
        fallback: () => {
          createShareEvent(db, eventId, {
            actor_user_id: userId,
            object_type: objectType,
            object_id: id,
            visibility: shareVisibility,
            payload_json: JSON.stringify(payload),
          });
          return { ok: true };
        },
      });
      setSocialNotice(`Shared as ${objectType.replace('_', ' ')} (${shareVisibility}).`);
      void loadSocialState(userId, issuedToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to create share event.');
    }
  }, [
    actorUserId,
    book,
    db,
    id,
    ensureActorIdentity,
    loadSocialState,
    rating,
    reviewText,
    shareNote,
    shareTargetUserId,
    shareVisibility,
  ]);

  const handleSendInvite = useCallback(async () => {
    const fromUserId = actorUserId.trim();
    const toUserId = inviteToUserId.trim();

    if (!fromUserId || !toUserId) {
      setSocialError('Both sender and recipient user IDs are required.');
      return;
    }

    setSocialError(null);
    setSocialNotice(null);

    try {
      const issuedToken = await ensureActorIdentity(fromUserId);
      const inviteId = createLocalId();
      await callSyncEndpoint(db, {
        path: 'friends/invites',
        method: 'POST',
        headers: issuedToken
          ? {
              'x-actor-identity-token': issuedToken,
            }
          : undefined,
        body: {
          id: inviteId,
          actorToken: issuedToken ?? undefined,
          fromUserId,
          toUserId,
          message: inviteMessage.trim() || null,
        },
        fallback: () => {
          createFriendInvite(db, {
            id: inviteId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            message: inviteMessage.trim() || null,
          });
          return { ok: true };
        },
      });
      setInviteMessage('');
      setSocialNotice(`Invite sent to ${toUserId}.`);
      void loadSocialState(fromUserId, issuedToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to send invite.');
    }
  }, [actorUserId, db, ensureActorIdentity, inviteMessage, inviteToUserId, loadSocialState]);

  const handleAcceptInvite = useCallback(async (inviteId: string) => {
    const actor = actorUserId.trim();
    try {
      const issuedToken = await ensureActorIdentity(actor);
      const result = await callSyncEndpoint<{ ok?: boolean }>(db, {
        path: `friends/invites/${encodeURIComponent(inviteId)}/accept`,
        method: 'POST',
        headers: issuedToken
          ? {
              'x-actor-identity-token': issuedToken,
            }
          : undefined,
        body: {
          actorToken: issuedToken ?? undefined,
          actorUserId: actor || undefined,
        },
        fallback: () => ({
          ok: acceptFriendInvite(db, inviteId, actor || undefined),
        }),
      });
      const accepted = result.ok === true;
      if (!accepted) {
        setSocialError('Invite cannot be accepted.');
        return;
      }
      setSocialError(null);
      setSocialNotice('Invite accepted.');
      void loadSocialState(actor, issuedToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to accept invite.');
    }
  }, [actorUserId, db, ensureActorIdentity, loadSocialState]);

  const handleDeclineInvite = useCallback(async (inviteId: string) => {
    const actor = actorUserId.trim();
    try {
      const issuedToken = await ensureActorIdentity(actor);
      const result = await callSyncEndpoint<{ ok?: boolean }>(db, {
        path: `friends/invites/${encodeURIComponent(inviteId)}/decline`,
        method: 'POST',
        headers: issuedToken
          ? {
              'x-actor-identity-token': issuedToken,
            }
          : undefined,
        body: {
          actorToken: issuedToken ?? undefined,
          actorUserId: actor || undefined,
        },
        fallback: () => ({
          ok: declineFriendInvite(db, inviteId, actor || undefined),
        }),
      });
      const declined = result.ok === true;
      if (!declined) {
        setSocialError('Invite cannot be declined.');
        return;
      }
      setSocialError(null);
      setSocialNotice('Invite declined.');
      void loadSocialState(actor, issuedToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to decline invite.');
    }
  }, [actorUserId, db, ensureActorIdentity, loadSocialState]);

  const handleRevokeInvite = useCallback(async (inviteId: string) => {
    const actor = actorUserId.trim();
    try {
      const issuedToken = await ensureActorIdentity(actor);
      const result = await callSyncEndpoint<{ ok?: boolean }>(db, {
        path: `friends/invites/${encodeURIComponent(inviteId)}/revoke`,
        method: 'POST',
        headers: issuedToken
          ? {
              'x-actor-identity-token': issuedToken,
            }
          : undefined,
        body: {
          actorToken: issuedToken ?? undefined,
          actorUserId: actor || undefined,
        },
        fallback: () => ({
          ok: revokeFriendInvite(db, inviteId, actor || undefined),
        }),
      });
      const revoked = result.ok === true;
      if (!revoked) {
        setSocialError('Invite cannot be revoked.');
        return;
      }
      setSocialError(null);
      setSocialNotice('Invite revoked.');
      void loadSocialState(actor, issuedToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to revoke invite.');
    }
  }, [actorUserId, db, ensureActorIdentity, loadSocialState]);

  const handleMessageTargetChange = useCallback(async (nextTargetUserId: string) => {
    setMessageTargetUserId(nextTargetUserId);
    const issuedToken = await ensureActorIdentity(actorUserId.trim());
    await loadMessageState(actorUserId.trim(), nextTargetUserId, issuedToken, false);
  }, [actorUserId, ensureActorIdentity, loadMessageState]);

  const handleSendMessage = useCallback(async () => {
    const fromUserId = actorUserId.trim();
    const toUserId = messageTargetUserId.trim();
    const content = messageDraft.trim();

    if (!fromUserId || !toUserId || !content) {
      setSocialError('Your user ID, target user ID, and message text are required.');
      return;
    }

    setSocialError(null);
    setSocialNotice(null);
    setIsSyncingMessages(true);

    try {
      const issuedToken = await ensureActorIdentity(fromUserId);
      queueOutgoingFriendMessage(db, {
        fromUserId,
        toUserId,
        content,
      });
      setMessageDraft('');

      const summary = await runFriendMessageSyncCycle(db, fromUserId, {
        actorToken: issuedToken ?? undefined,
      });
      const pending = summary.outbox.pending + summary.outbox.retry;
      if (summary.ok) {
        setSocialNotice('Message synced.');
      } else {
        setSocialNotice(`Message queued. Pending retries: ${pending}.`);
      }
      await loadMessageState(fromUserId, toUserId, issuedToken, false);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSyncingMessages(false);
    }
  }, [actorUserId, db, ensureActorIdentity, loadMessageState, messageDraft, messageTargetUserId]);

  const handleSyncMessages = useCallback(async () => {
    const userId = actorUserId.trim();
    const targetUserId = messageTargetUserId.trim();
    if (!userId) {
      setSocialError('Enter your user ID to sync messages.');
      return;
    }

    setSocialError(null);
    setSocialNotice(null);
    setIsSyncingMessages(true);

    try {
      const issuedToken = await ensureActorIdentity(userId);
      const summary = await runFriendMessageSyncCycle(db, userId, {
        actorToken: issuedToken ?? undefined,
      });
      const pending = summary.outbox.pending + summary.outbox.retry;
      setSocialNotice(
        summary.ok
          ? `Messages synced. Sent ${summary.sent}, received ${summary.received}.`
          : `Sync partial. Sent ${summary.sent}, received ${summary.received}, pending ${pending}.`,
      );
      await loadMessageState(userId, targetUserId, issuedToken, false);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to sync messages.');
    } finally {
      setIsSyncingMessages(false);
    }
  }, [actorUserId, db, ensureActorIdentity, loadMessageState, messageTargetUserId]);

  const handleMarkMessageRead = useCallback(async (messageId: string) => {
    const userId = actorUserId.trim();
    const targetUserId = messageTargetUserId.trim();
    if (!userId) {
      setSocialError('Enter your user ID first.');
      return;
    }

    try {
      const issuedToken = await ensureActorIdentity(userId);
      const result = await markFriendMessageReadWithSync(db, userId, messageId, issuedToken ?? undefined);
      if (!result.ok) {
        throw new Error(result.reason ?? 'Message not found.');
      }
      await loadMessageState(userId, targetUserId, issuedToken, false);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to mark message as read.');
    }
  }, [actorUserId, db, ensureActorIdentity, loadMessageState, messageTargetUserId]);

  if (!book) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color={colors.textTertiary}>Book not found.</Text>
      </View>
    );
  }

  const authors = parseAuthors(book.authors);
  const subjects = book.subjects ? JSON.parse(book.subjects) as string[] : [];
  const shelfLabel =
    session?.status === 'reading' ? 'Currently Reading' :
    session?.status === 'finished' ? 'Finished' :
    session?.status === 'dnf' ? 'Did Not Finish' :
    'Want to Read';
  const actorId = actorUserId.trim();

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.coverHero}>
          <BookCover coverUrl={book.cover_url} size="detail" title={book.title} />
        </View>

        <View style={styles.titleSection}>
          <Text variant="bookTitle" style={styles.title}>{book.title}</Text>
          <Text variant="bookAuthor">{authors.join(', ')}</Text>
        </View>

        <View style={styles.badgeRow}>
          <ShelfBadge name={shelfLabel} color={BOOKS_ACCENT} />
        </View>

        <View style={styles.ratingSection}>
          <Text variant="label" color={colors.textTertiary}>Your Rating</Text>
          <StarRating rating={rating} onChange={handleRatingChange} size={32} />
        </View>

        {session?.status === 'reading' && book.page_count && (
          <Card style={styles.progressCard}>
            <Text variant="label" color={colors.textTertiary}>Reading Progress</Text>
            <ProgressSlider
              currentPage={session.current_page}
              totalPages={book.page_count}
              onPageChange={handlePageChange}
            />
          </Card>
        )}

        <Card style={styles.metaCard}>
          <Text variant="label" color={colors.textTertiary}>Details</Text>
          {book.publisher && <MetaRow label="Publisher" value={book.publisher} />}
          {book.publish_year && <MetaRow label="Year" value={String(book.publish_year)} />}
          {book.page_count && <MetaRow label="Pages" value={String(book.page_count)} />}
          {book.isbn_13 && <MetaRow label="ISBN" value={book.isbn_13} />}
          <MetaRow label="Format" value={book.format} />
        </Card>

        <Card style={styles.reviewCard}>
          <Text variant="label" color={colors.textTertiary}>Notes & Review</Text>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            onBlur={handleReviewBlur}
            placeholder="Write your thoughts..."
            placeholderTextColor={colors.textTertiary}
            multiline
            style={styles.reviewInput}
          />
        </Card>

        <View style={styles.tagSection}>
          <Text variant="label" color={colors.textTertiary}>Tags</Text>
          <View style={styles.tagRow}>
            {subjects.slice(0, 3).map((s) => (
              <TagPill key={s} name={s} color={colors.surfaceElevated} />
            ))}
            {tags.map((t) => (
              <TagPill key={t.id} name={t.name} color={t.color ?? undefined} onRemove={() => {}} />
            ))}
          </View>
        </View>

        <Card style={styles.shareCard}>
          <Text variant="label" color={colors.textTertiary}>Share and Friends</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Create share visibility, manage invites, and preview this user&apos;s feed.
          </Text>

          <TextInput
            value={actorUserId}
            onChangeText={(value) => {
              setActorUserId(value);
              setActorToken(null);
            }}
            placeholder="Your user ID (e.g. demo-alice)"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
          <Text variant="caption" color={colors.textSecondary}>
            {actorToken ? 'Signed actor identity active.' : 'Using legacy user ID fallback.'}
          </Text>

          <View style={styles.visibilityRow}>
            {(['private', 'friends', 'public'] as ShareVisibility[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setShareVisibility(option)}
                style={[
                  styles.visibilityChip,
                  shareVisibility === option && styles.visibilityChipActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={shareVisibility === option ? colors.background : colors.textSecondary}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={shareTargetUserId}
            onChangeText={setShareTargetUserId}
            placeholder="Optional share target user ID"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <TextInput
            value={shareNote}
            onChangeText={setShareNote}
            placeholder="Share note"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={styles.shareNoteInput}
          />

          <Button label="Share this Book Update" onPress={handleShare} />

          <View style={styles.divider} />

          <TextInput
            value={inviteToUserId}
            onChangeText={setInviteToUserId}
            placeholder="Invite user ID"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
          <TextInput
            value={inviteMessage}
            onChangeText={setInviteMessage}
            placeholder="Invite message (optional)"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
          <Button variant="secondary" label="Send Friend Invite" onPress={handleSendInvite} />

          <View style={styles.divider} />

          <Text variant="label">Direct Messages</Text>
          <View style={styles.messageComposeRow}>
            <TextInput
              value={messageTargetUserId}
              onChangeText={handleMessageTargetChange}
              placeholder="Friend user ID"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, styles.messageInput]}
            />
            <Button
              variant="secondary"
              label={isSyncingMessages ? 'Syncing...' : 'Sync'}
              onPress={() => { void handleSyncMessages(); }}
            />
          </View>
          <View style={styles.messageComposeRow}>
            <TextInput
              value={messageDraft}
              onChangeText={setMessageDraft}
              placeholder="Type a message"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, styles.messageInput]}
            />
            <Button label="Send" onPress={() => { void handleSendMessage(); }} />
          </View>

          <View style={styles.messagePanels}>
            <View style={styles.messagePanel}>
              <Text variant="label">Inbox</Text>
              {messageInbox.length === 0 ? (
                <Text variant="caption" color={colors.textTertiary}>No conversations yet.</Text>
              ) : (
                messageInbox.map((item) => (
                  <Pressable
                    key={item.friend_user_id}
                    onPress={() => handleMessageTargetChange(item.friend_user_id)}
                    style={styles.inboxRow}
                  >
                    <Text variant="caption">{item.friend_user_id}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {item.unread_count > 0 ? `${item.unread_count} unread • ` : ''}
                      {toDisplayDate(item.last_message_at)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.messagePanel}>
              <Text variant="label">Conversation</Text>
              {messages.length === 0 ? (
                <Text variant="caption" color={colors.textTertiary}>
                  No messages for this conversation.
                </Text>
              ) : (
                messages.map((message) => {
                  const isIncoming = message.recipient_user_id === actorId;
                  const unreadIncoming = isIncoming && !message.read_at;
                  return (
                    <View key={message.id} style={styles.socialItem}>
                      <Text variant="caption">
                        {isIncoming ? message.sender_user_id : 'You'} • {message.content}
                      </Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {message.sync_state} • {toDisplayDate(message.created_at)}
                      </Text>
                      {unreadIncoming && (
                        <Pressable
                          onPress={() => { void handleMarkMessageRead(message.id); }}
                          style={styles.inlineTextAction}
                        >
                          <Text variant="caption" color={BOOKS_ACCENT}>Mark Read</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {socialError && (
            <Text variant="caption" color="#FCA5A5">{socialError}</Text>
          )}
          {socialNotice && (
            <Text variant="caption" color="#6EE7B7">{socialNotice}</Text>
          )}

          <View style={styles.socialSection}>
            <Text variant="label">Incoming Invites</Text>
            {incomingInvites.length === 0 ? (
              <Text variant="caption" color={colors.textTertiary}>No incoming invites.</Text>
            ) : (
              incomingInvites.map((invite) => (
                <View key={invite.id} style={styles.socialItem}>
                  <Text variant="caption">
                    {invite.from_user_id} → {invite.to_user_id}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {invite.status} • {toDisplayDate(invite.created_at)}
                  </Text>
                  {invite.status === 'pending' && (
                    <View style={styles.inlineActionRow}>
                      <Button
                        variant="secondary"
                        label="Accept"
                        onPress={() => handleAcceptInvite(invite.id)}
                      />
                      <Button
                        variant="ghost"
                        label="Decline"
                        onPress={() => handleDeclineInvite(invite.id)}
                      />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.socialSection}>
            <Text variant="label">Outgoing Invites</Text>
            {outgoingInvites.length === 0 ? (
              <Text variant="caption" color={colors.textTertiary}>No outgoing invites.</Text>
            ) : (
              outgoingInvites.map((invite) => (
                <View key={invite.id} style={styles.socialItem}>
                  <Text variant="caption">
                    {invite.from_user_id} → {invite.to_user_id}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {invite.status} • {toDisplayDate(invite.created_at)}
                  </Text>
                  {invite.status === 'pending' && (
                    <Button
                      variant="ghost"
                      label="Revoke"
                      onPress={() => handleRevokeInvite(invite.id)}
                    />
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.socialSection}>
            <Text variant="label">Friends</Text>
            {friends.length === 0 ? (
              <Text variant="caption" color={colors.textTertiary}>No accepted friends yet.</Text>
            ) : (
              friends.map((friend) => (
                <View key={`${friend.user_id}:${friend.friend_user_id}`} style={styles.socialItem}>
                  <Text variant="caption">
                    {friend.display_name ?? friend.friend_user_id}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {friend.friend_user_id}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.socialSection}>
            <Text variant="label">Visible Share Feed</Text>
            {shareEvents.length === 0 ? (
              <Text variant="caption" color={colors.textTertiary}>
                No visible share events for this book.
              </Text>
            ) : (
              shareEvents.map((event) => {
                const payload = parsePayloadJson(event.payload_json);
                const note = typeof payload.note === 'string' ? payload.note : null;
                return (
                  <View key={event.id} style={styles.socialItem}>
                    <Text variant="caption">
                      {event.actor_user_id} • {event.object_type.replace('_', ' ')} ({event.visibility})
                    </Text>
                    {note && (
                      <Text variant="caption" color={colors.textSecondary}>{note}</Text>
                    )}
                    <Text variant="caption" color={colors.textSecondary}>
                      {toDisplayDate(event.created_at)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button variant="secondary" label="Move to Shelf" onPress={() => {}} />
          <Button variant="ghost" label="Delete from Library" onPress={handleDelete} />
        </View>
      </ScrollView>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="caption" color={colors.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl * 2,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverHero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  title: {
    textAlign: 'center',
  },
  badgeRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  progressCard: {
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  metaCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reviewCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  reviewInput: {
    color: colors.text,
    fontFamily: 'Literata',
    fontSize: 16,
    lineHeight: 28,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  shareCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 14,
  },
  messageInput: {
    flex: 1,
  },
  shareNoteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: 'Literata',
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  visibilityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  visibilityChipActive: {
    backgroundColor: BOOKS_ACCENT,
    borderColor: BOOKS_ACCENT,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  socialSection: {
    gap: spacing.xs,
  },
  socialItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xs,
    gap: 2,
  },
  messageComposeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  messagePanels: {
    gap: spacing.sm,
  },
  messagePanel: {
    gap: spacing.xs,
  },
  inboxRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xs,
    gap: 2,
  },
  inlineTextAction: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
});
