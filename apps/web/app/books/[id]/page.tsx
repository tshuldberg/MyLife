'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchBook,
  fetchSessionsForBook,
  fetchReviewForBook,
  fetchTagsForBook,
  ensureActorIdentityAction,
  createBookShareEventAction,
  fetchVisibleBookShareEventsAction,
  sendFriendInviteAction,
  fetchFriendInvitesAction,
  acceptFriendInviteAction,
  declineFriendInviteAction,
  revokeFriendInviteAction,
  fetchFriendsAction,
  queueFriendMessageAction,
  syncFriendMessagesAction,
  fetchFriendMessageConversationAction,
  fetchFriendMessageInboxAction,
  markFriendMessageReadAction,
} from '../actions';
import type { ShareObjectType, ShareVisibility } from '@mylife/books';
import type { FriendMessageContentType } from '@mylife/db';

// Mapped types for template rendering (camelCase from snake_case DB fields)
interface BookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string;
  coverUrl: string | null;
  publisher: string | null;
  publishYear: number | null;
  pageCount: number | null;
  isbn13: string | null;
  description: string | null;
  format: string;
  language: string;
  subjects: string | null;
}

interface ReadingSessionInfo {
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  currentPage: number;
}

interface ReviewInfo {
  rating: number | null;
  reviewText: string | null;
  favoriteQuote: string | null;
  isFavorite: boolean;
}

interface FriendInviteInfo {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  message: string | null;
  created_at: string;
}

interface FriendInfo {
  user_id: string;
  friend_user_id: string;
  display_name: string | null;
  status: string;
}

interface ShareEventInfo {
  id: string;
  actor_user_id: string;
  object_type: ShareObjectType;
  object_id: string;
  visibility: ShareVisibility;
  payload_json: string;
  created_at: string;
}

interface FriendMessageInfo {
  id: string;
  client_message_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  content_type: FriendMessageContentType;
  content: string;
  source: string;
  sync_state: string;
  server_message_id: string | null;
  created_at: string;
  read_at: string | null;
  last_error: string | null;
  updated_at: string;
}

interface FriendInboxInfo {
  friend_user_id: string;
  last_message_at: string;
  last_message_content: string;
  last_message_content_type: FriendMessageContentType;
  unread_count: number;
}

function toDisplayTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function parseSharePayload(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export default function BookDetailPage() {
  const params = useParams();
  const bookId = params.id as string;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [session, setSession] = useState<ReadingSessionInfo | null>(null);
  const [review, setReview] = useState<ReviewInfo | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorUserId, setActorUserId] = useState('demo-alice');
  const [actorToken, setActorToken] = useState<string | null>(null);
  const [inviteToUserId, setInviteToUserId] = useState('demo-bob');
  const [inviteMessage, setInviteMessage] = useState('');
  const [shareVisibility, setShareVisibility] = useState<ShareVisibility>('friends');
  const [shareTargetUserId, setShareTargetUserId] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [incomingInvites, setIncomingInvites] = useState<FriendInviteInfo[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<FriendInviteInfo[]>([]);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [shareEvents, setShareEvents] = useState<ShareEventInfo[]>([]);
  const [messageTargetUserId, setMessageTargetUserId] = useState('demo-bob');
  const [messageDraft, setMessageDraft] = useState('');
  const [messages, setMessages] = useState<FriendMessageInfo[]>([]);
  const [messageInbox, setMessageInbox] = useState<FriendInboxInfo[]>([]);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const loadSocialState = useCallback(async (viewerToken: string) => {
    if (!viewerToken || !bookId) return;

    setSocialLoading(true);
    setSocialError(null);

    try {
      const [invites, friendRows, visibleEvents] = await Promise.all([
        fetchFriendInvitesAction({ actorToken: viewerToken }),
        fetchFriendsAction(viewerToken),
        fetchVisibleBookShareEventsAction({
          viewerToken,
          objectId: bookId,
          limit: 20,
        }),
      ]);

      setIncomingInvites((invites.incoming ?? []) as FriendInviteInfo[]);
      setOutgoingInvites((invites.outgoing ?? []) as FriendInviteInfo[]);
      const normalizedFriends = (friendRows ?? []) as FriendInfo[];
      setFriends(normalizedFriends);
      setMessageTargetUserId((current) => {
        if (current && normalizedFriends.some((friend) => friend.friend_user_id === current)) {
          return current;
        }
        return normalizedFriends[0]?.friend_user_id ?? current;
      });
      setShareEvents((visibleEvents ?? []) as ShareEventInfo[]);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to load sharing data.');
    } finally {
      setSocialLoading(false);
    }
  }, [bookId]);

  const loadMessageState = useCallback(async (
    viewerToken: string,
    friendUserId: string,
    syncFirst: boolean,
  ) => {
    if (!viewerToken) return;

    setIsSyncingMessages(syncFirst);
    try {
      const [inboxRows, conversationRows] = await Promise.all([
        fetchFriendMessageInboxAction({
          actorToken: viewerToken,
          limit: 50,
          syncFirst,
        }),
        friendUserId
          ? fetchFriendMessageConversationAction({
              actorToken: viewerToken,
              friendUserId,
              limit: 120,
              syncFirst: false,
            })
          : Promise.resolve([]),
      ]);

      setMessageInbox((inboxRows ?? []) as FriendInboxInfo[]);
      setMessages((conversationRows ?? []) as FriendMessageInfo[]);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to load message state.');
    } finally {
      setIsSyncingMessages(false);
    }
  }, []);

  useEffect(() => {
    async function loadBookData() {
      setLoading(true);
      try {
        const [bookData, sessions, reviewData, tagData] = await Promise.all([
          fetchBook(bookId),
          fetchSessionsForBook(bookId),
          fetchReviewForBook(bookId),
          fetchTagsForBook(bookId),
        ]);

        if (bookData) {
          setBook({
            id: bookData.id,
            title: bookData.title,
            subtitle: bookData.subtitle,
            authors: bookData.authors,
            coverUrl: bookData.cover_url,
            publisher: bookData.publisher,
            publishYear: bookData.publish_year,
            pageCount: bookData.page_count,
            isbn13: bookData.isbn_13,
            description: bookData.description,
            format: bookData.format,
            language: bookData.language,
            subjects: bookData.subjects,
          });
        }

        // Use latest session for status display
        if (sessions && sessions.length > 0) {
          const latest = sessions[0];
          setSession({
            status: latest.status,
            startedAt: latest.started_at,
            finishedAt: latest.finished_at,
            currentPage: latest.current_page,
          });
        }

        if (reviewData) {
          setReview({
            rating: reviewData.rating,
            reviewText: reviewData.review_text,
            favoriteQuote: reviewData.favorite_quote,
            isFavorite: reviewData.is_favorite === 1,
          });
        }

        if (tagData) {
          setTags(tagData.map((t) => t.name));
        }
      } catch (err) {
        console.error('Failed to load book data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookData();
  }, [bookId]);

  useEffect(() => {
    const trimmed = actorUserId.trim();
    if (!trimmed) {
      setActorToken(null);
      setIncomingInvites([]);
      setOutgoingInvites([]);
      setFriends([]);
      setShareEvents([]);
      return;
    }

    void (async () => {
      try {
        const identity = await ensureActorIdentityAction({ userId: trimmed });
        setActorToken(identity.actorToken);
        await loadSocialState(identity.actorToken);
      } catch (err) {
        setActorToken(null);
        setSocialError(err instanceof Error ? err.message : 'Failed to establish actor identity.');
      }
    })();
  }, [actorUserId, loadSocialState]);

  useEffect(() => {
    if (!actorToken) {
      setMessages([]);
      setMessageInbox([]);
      return;
    }
    void loadMessageState(actorToken, messageTargetUserId.trim(), true);
  }, [actorToken, messageTargetUserId, loadMessageState]);

  if (loading) {
    return (
      <div style={styles.notFound}>
        <p style={styles.notFoundIcon}>📖</p>
        <h2 style={styles.notFoundTitle}>Loading...</h2>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={styles.notFound}>
        <p style={styles.notFoundIcon}>📖</p>
        <h2 style={styles.notFoundTitle}>Book not found</h2>
        <p style={styles.notFoundText}>
          This book may have been removed from your library.
        </p>
        <Link href="/books" style={styles.backLink}>
          Back to Library
        </Link>
      </div>
    );
  }

  const authors = (() => {
    try {
      return JSON.parse(book.authors).join(', ');
    } catch {
      return book.authors;
    }
  })();

  const subjectList = (() => {
    if (!book.subjects) return [];
    try {
      return JSON.parse(book.subjects) as string[];
    } catch {
      return [];
    }
  })();

  const shareObjectType: ShareObjectType =
    review?.reviewText
      ? 'book_review'
      : review?.rating != null
        ? 'book_rating'
        : 'generic';
  const actorId = actorUserId.trim();

  async function handleShare() {
    if (!actorToken) {
      setSocialError('Enter your user ID to create a share event.');
      return;
    }
    if (!book) {
      setSocialError('Book not found.');
      return;
    }
    const currentBook = book;

    setSocialError(null);
    setSocialNotice(null);

    try {
      const payload: Record<string, unknown> = {
        bookTitle: currentBook.title,
        authors,
      };
      if (review?.rating != null) payload.rating = review.rating;
      if (review?.reviewText) payload.reviewText = review.reviewText;
      if (shareNote.trim()) payload.note = shareNote.trim();
      if (shareTargetUserId.trim()) payload.targetUserId = shareTargetUserId.trim();

      const shareEvent = await createBookShareEventAction({
        actorToken,
        objectType: shareObjectType,
        objectId: currentBook.id,
        visibility: shareVisibility,
        payload,
      });

      setSocialNotice(`Shared (${shareVisibility}) as event ${shareEvent?.id ?? 'created'}.`);
      await loadSocialState(actorToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to create share event.');
    }
  }

  async function handleSendInvite() {
    const fromUserId = actorUserId.trim();
    const toUserId = inviteToUserId.trim();

    if (!actorToken || !fromUserId || !toUserId) {
      setSocialError('Both sender and recipient user IDs are required.');
      return;
    }

    setSocialError(null);
    setSocialNotice(null);

    try {
      await sendFriendInviteAction({
        actorToken,
        toUserId,
        message: inviteMessage.trim() || undefined,
      });
      setInviteMessage('');
      setSocialNotice(`Invite sent from ${fromUserId} to ${toUserId}.`);
      await loadSocialState(actorToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to send invite.');
    }
  }

  async function handleAcceptInvite(inviteId: string) {
    if (!actorToken) {
      setSocialError('Actor identity is not set.');
      return;
    }
    try {
      const result = await acceptFriendInviteAction(inviteId, actorToken);
      if (!result.ok) throw new Error('Invite cannot be accepted.');
      setSocialNotice('Invite accepted.');
      await loadSocialState(actorToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to accept invite.');
    }
  }

  async function handleDeclineInvite(inviteId: string) {
    if (!actorToken) {
      setSocialError('Actor identity is not set.');
      return;
    }
    try {
      const result = await declineFriendInviteAction(inviteId, actorToken);
      if (!result.ok) throw new Error('Invite cannot be declined.');
      setSocialNotice('Invite declined.');
      await loadSocialState(actorToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to decline invite.');
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!actorToken) {
      setSocialError('Actor identity is not set.');
      return;
    }
    try {
      const result = await revokeFriendInviteAction(inviteId, actorToken);
      if (!result.ok) throw new Error('Invite cannot be revoked.');
      setSocialNotice('Invite revoked.');
      await loadSocialState(actorToken);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to revoke invite.');
    }
  }

  async function handleSendMessage() {
    const targetUserId = messageTargetUserId.trim();
    const content = messageDraft.trim();

    if (!actorToken || !targetUserId || !content) {
      setSocialError('Actor identity, target friend, and message text are required.');
      return;
    }

    setSocialError(null);
    setSocialNotice(null);

    try {
      await queueFriendMessageAction({
        actorToken,
        toUserId: targetUserId,
        content,
      });
      setMessageDraft('');

      const syncResult = await syncFriendMessagesAction({ actorToken });
      const pending = syncResult.outbox.pending + syncResult.outbox.retry;
      if (syncResult.ok) {
        setSocialNotice('Message synced.');
      } else {
        setSocialNotice(`Message queued. Pending retries: ${pending}.`);
      }

      await loadMessageState(actorToken, targetUserId, false);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to send message.');
    }
  }

  async function handleSyncMessages() {
    if (!actorToken) {
      setSocialError('Actor identity is not set.');
      return;
    }

    setIsSyncingMessages(true);
    setSocialError(null);
    setSocialNotice(null);
    try {
      const result = await syncFriendMessagesAction({ actorToken });
      const pending = result.outbox.pending + result.outbox.retry;
      setSocialNotice(
        result.ok
          ? `Messages synced. Sent ${result.sent}, received ${result.received}.`
          : `Sync partial. Sent ${result.sent}, received ${result.received}, pending ${pending}.`,
      );
      await loadMessageState(actorToken, messageTargetUserId.trim(), false);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Message sync failed.');
    } finally {
      setIsSyncingMessages(false);
    }
  }

  async function handleMarkMessageRead(messageId: string) {
    if (!actorToken) {
      setSocialError('Actor identity is not set.');
      return;
    }

    try {
      await markFriendMessageReadAction({
        actorToken,
        messageId,
      });
      await loadMessageState(actorToken, messageTargetUserId.trim(), false);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Failed to mark message as read.');
    }
  }

  return (
    <div style={styles.container}>
      {/* Left column: cover */}
      <div style={styles.coverColumn}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} style={styles.cover} />
        ) : (
          <div style={styles.coverPlaceholder}>
            <span style={styles.coverInitial}>{book.title.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Right column: metadata */}
      <div style={styles.infoColumn}>
        <h1 style={styles.title}>{book.title}</h1>
        {book.subtitle && <p style={styles.subtitle}>{book.subtitle}</p>}
        <p style={styles.authors}>by {authors}</p>

        {/* Reading status */}
        {session && (
          <div style={styles.statusBadgeWrapper}>
            <span style={styles.statusBadge}>
              {session.status.replace(/_/g, ' ')}
            </span>
            {session.currentPage > 0 && book.pageCount && (
              <span style={styles.progress}>
                Page {session.currentPage} of {book.pageCount}
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        {review && review.rating && (
          <div style={styles.ratingSection}>
            <span style={styles.stars}>
              {'★'.repeat(Math.floor(review.rating))}
              {review.rating % 1 ? '½' : ''}
            </span>
            <span style={styles.ratingNumber}>{review.rating} / 5</span>
            {review.isFavorite && <span style={styles.favorite}>♥</span>}
          </div>
        )}

        {/* Metadata grid */}
        <div style={styles.metaGrid}>
          {book.publisher && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Publisher</span>
              <span style={styles.metaValue}>{book.publisher}</span>
            </div>
          )}
          {book.publishYear && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Published</span>
              <span style={styles.metaValue}>{book.publishYear}</span>
            </div>
          )}
          {book.pageCount && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Pages</span>
              <span style={styles.metaValue}>{book.pageCount}</span>
            </div>
          )}
          {book.isbn13 && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>ISBN</span>
              <span style={styles.metaValue}>{book.isbn13}</span>
            </div>
          )}
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Format</span>
            <span style={styles.metaValue}>{book.format}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Language</span>
            <span style={styles.metaValue}>{book.language}</span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={styles.tagsSection}>
            <span style={styles.metaLabel}>Tags</span>
            <div style={styles.tagList}>
              {tags.map((tag) => (
                <span key={tag} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {book.description && (
          <div style={styles.descriptionSection}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <p style={styles.description}>{book.description}</p>
          </div>
        )}

        {/* Review */}
        {review?.reviewText && (
          <div style={styles.reviewSection}>
            <h3 style={styles.sectionTitle}>Review</h3>
            <p style={styles.reviewText}>{review.reviewText}</p>
          </div>
        )}

        {/* Favorite quote */}
        {review?.favoriteQuote && (
          <div style={styles.quoteSection}>
            <h3 style={styles.sectionTitle}>Favorite Quote</h3>
            <blockquote style={styles.quote}>{review.favoriteQuote}</blockquote>
          </div>
        )}

        {/* Subjects */}
        {subjectList.length > 0 && (
          <div style={styles.subjectsSection}>
            <h3 style={styles.sectionTitle}>Subjects</h3>
            <div style={styles.tagList}>
              {subjectList.slice(0, 10).map((s) => (
                <span key={s} style={styles.subjectTag}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={styles.shareSection}>
          <h3 style={styles.sectionTitle}>Share and Friends</h3>
          <p style={styles.shareHelp}>
            Set visibility for this book update, invite friends, and preview what this user can see.
          </p>

          <div style={styles.shareGrid}>
            <label style={styles.inputLabel}>
              Your User ID
              <input
                value={actorUserId}
                onChange={(event) => setActorUserId(event.target.value)}
                style={styles.input}
                placeholder="demo-alice"
              />
            </label>

            <label style={styles.inputLabel}>
              Visibility
              <select
                value={shareVisibility}
                onChange={(event) => setShareVisibility(event.target.value as ShareVisibility)}
                style={styles.select}
              >
                <option value="private">private</option>
                <option value="friends">friends</option>
                <option value="public">public</option>
              </select>
            </label>

            <label style={styles.inputLabel}>
              Optional Share Target
              <input
                value={shareTargetUserId}
                onChange={(event) => setShareTargetUserId(event.target.value)}
                style={styles.input}
                placeholder="friend-user-id"
              />
            </label>
          </div>

          <label style={styles.inputLabel}>
            Share Note
            <textarea
              value={shareNote}
              onChange={(event) => setShareNote(event.target.value)}
              style={styles.textarea}
              placeholder="What should friends know about this read?"
            />
          </label>

          <button type="button" style={styles.primaryAction} onClick={() => void handleShare()}>
            Share {shareObjectType.replace(/_/g, ' ')}
          </button>

          <div style={styles.inviteRow}>
            <input
              value={inviteToUserId}
              onChange={(event) => setInviteToUserId(event.target.value)}
              style={styles.input}
              placeholder="Invite user ID"
            />
            <input
              value={inviteMessage}
              onChange={(event) => setInviteMessage(event.target.value)}
              style={styles.input}
              placeholder="Invite message (optional)"
            />
            <button type="button" style={styles.secondaryAction} onClick={() => void handleSendInvite()}>
              Send Invite
            </button>
          </div>

          <div style={styles.messageComposer}>
            <h4 style={styles.subheading}>Direct Messages</h4>
            <div style={styles.messageComposeRow}>
              <input
                value={messageTargetUserId}
                onChange={(event) => setMessageTargetUserId(event.target.value)}
                style={styles.input}
                placeholder="Friend user ID"
                list="friend-user-options"
              />
              <button
                type="button"
                style={styles.secondaryAction}
                onClick={() => void handleSyncMessages()}
                disabled={isSyncingMessages}
              >
                {isSyncingMessages ? 'Syncing...' : 'Sync Messages'}
              </button>
            </div>
            <datalist id="friend-user-options">
              {friends.map((friend) => (
                <option key={friend.friend_user_id} value={friend.friend_user_id} />
              ))}
            </datalist>
            <div style={styles.messageComposeRow}>
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                style={styles.input}
                placeholder="Type a message"
              />
              <button type="button" style={styles.primaryAction} onClick={() => void handleSendMessage()}>
                Send
              </button>
            </div>

            <div style={styles.messagePanels}>
              <div style={styles.messagePanel}>
                <h4 style={styles.subheading}>Inbox</h4>
                {messageInbox.length === 0 ? (
                  <p style={styles.emptySmall}>No conversations yet.</p>
                ) : (
                  messageInbox.map((item) => (
                    <button
                      key={item.friend_user_id}
                      type="button"
                      style={styles.inboxRow}
                      onClick={() => setMessageTargetUserId(item.friend_user_id)}
                    >
                      <span style={styles.socialLine}>{item.friend_user_id}</span>
                      <span style={styles.socialMeta}>
                        {item.unread_count > 0 ? `${item.unread_count} unread • ` : ''}
                        {toDisplayTime(item.last_message_at)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div style={styles.messagePanel}>
                <h4 style={styles.subheading}>Conversation</h4>
                {messages.length === 0 ? (
                  <p style={styles.emptySmall}>No messages in this conversation.</p>
                ) : (
                  messages.map((message) => {
                    const isIncoming = message.recipient_user_id === actorId;
                    const unreadIncoming = isIncoming && !message.read_at;
                    return (
                      <div key={message.id} style={styles.socialItem}>
                        <p style={styles.socialLine}>
                          <strong>{isIncoming ? message.sender_user_id : 'You'}</strong>: {message.content}
                        </p>
                        <p style={styles.socialMeta}>
                          {message.sync_state} • {toDisplayTime(message.created_at)}
                        </p>
                        {unreadIncoming && (
                          <button
                            type="button"
                            style={styles.smallActionGhost}
                            onClick={() => void handleMarkMessageRead(message.id)}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {socialLoading && <p style={styles.metaValue}>Loading sharing data...</p>}
          {socialError && <p style={styles.errorText}>{socialError}</p>}
          {socialNotice && <p style={styles.successText}>{socialNotice}</p>}

          <div style={styles.socialColumns}>
            <div style={styles.socialColumn}>
              <h4 style={styles.subheading}>Incoming Invites</h4>
              {incomingInvites.length === 0 ? (
                <p style={styles.emptySmall}>No incoming invites.</p>
              ) : (
                incomingInvites.map((invite) => (
                  <div key={invite.id} style={styles.socialItem}>
                    <p style={styles.socialLine}>
                      <strong>{invite.from_user_id}</strong> → {invite.to_user_id}
                    </p>
                    {invite.message && <p style={styles.socialMeta}>{invite.message}</p>}
                    <p style={styles.socialMeta}>{invite.status} • {toDisplayTime(invite.created_at)}</p>
                    {invite.status === 'pending' && (
                      <div style={styles.inlineActions}>
                        <button
                          type="button"
                          style={styles.smallAction}
                          onClick={() => void handleAcceptInvite(invite.id)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          style={styles.smallActionGhost}
                          onClick={() => void handleDeclineInvite(invite.id)}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={styles.socialColumn}>
              <h4 style={styles.subheading}>Outgoing Invites</h4>
              {outgoingInvites.length === 0 ? (
                <p style={styles.emptySmall}>No outgoing invites.</p>
              ) : (
                outgoingInvites.map((invite) => (
                  <div key={invite.id} style={styles.socialItem}>
                    <p style={styles.socialLine}>
                      <strong>{invite.from_user_id}</strong> → {invite.to_user_id}
                    </p>
                    <p style={styles.socialMeta}>{invite.status} • {toDisplayTime(invite.created_at)}</p>
                    {invite.status === 'pending' && (
                      <button
                        type="button"
                        style={styles.smallActionGhost}
                        onClick={() => void handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={styles.socialColumn}>
              <h4 style={styles.subheading}>Friends</h4>
              {friends.length === 0 ? (
                <p style={styles.emptySmall}>No accepted friends yet.</p>
              ) : (
                friends.map((friend) => (
                  <div key={`${friend.user_id}:${friend.friend_user_id}`} style={styles.socialItem}>
                    <p style={styles.socialLine}>
                      {friend.display_name ?? friend.friend_user_id}
                    </p>
                    <p style={styles.socialMeta}>{friend.friend_user_id} • {friend.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={styles.feedSection}>
            <h4 style={styles.subheading}>Visible Share Feed</h4>
            {shareEvents.length === 0 ? (
              <p style={styles.emptySmall}>No visible share events for this book yet.</p>
            ) : (
              shareEvents.map((event) => {
                const payload = parseSharePayload(event.payload_json);
                const note = typeof payload.note === 'string' ? payload.note : undefined;
                return (
                  <div key={event.id} style={styles.socialItem}>
                    <p style={styles.socialLine}>
                      {event.actor_user_id} shared {event.object_type.replace(/_/g, ' ')} ({event.visibility})
                    </p>
                    {note && <p style={styles.socialMeta}>{note}</p>}
                    <p style={styles.socialMeta}>{toDisplayTime(event.created_at)}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
  },
  coverColumn: {
    flexShrink: 0,
    width: '200px',
  },
  cover: {
    width: '200px',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  coverPlaceholder: {
    width: '200px',
    height: '300px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverInitial: {
    fontSize: '64px',
    fontWeight: 700,
    color: 'var(--accent-books)',
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    margin: '4px 0 0 0',
    fontStyle: 'italic',
  },
  authors: {
    fontSize: '16px',
    color: 'var(--accent-books)',
    margin: '8px 0 0 0',
    fontWeight: 500,
  },
  statusBadgeWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text)',
    textTransform: 'capitalize' as const,
  },
  progress: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  ratingSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
  },
  stars: {
    fontSize: '20px',
    color: 'var(--accent-books)',
  },
  ratingNumber: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  favorite: {
    fontSize: '18px',
    color: '#EF4444',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '24px',
    padding: '16px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metaValue: {
    fontSize: '14px',
    color: 'var(--text)',
  },
  tagsSection: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  tag: {
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    fontSize: '12px',
    color: 'var(--accent-books)',
    fontWeight: 500,
  },
  descriptionSection: {
    marginTop: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 8px 0',
  },
  description: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    margin: 0,
  },
  reviewSection: {
    marginTop: '24px',
  },
  reviewText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    margin: 0,
    fontStyle: 'italic',
  },
  quoteSection: {
    marginTop: '24px',
  },
  quote: {
    margin: 0,
    padding: '12px 16px',
    borderLeft: '3px solid var(--accent-books)',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    fontStyle: 'italic',
    backgroundColor: 'var(--surface)',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
  },
  subjectsSection: {
    marginTop: '24px',
  },
  subjectTag: {
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  shareSection: {
    marginTop: '28px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--surface)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  shareHelp: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  shareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '8px',
  },
  inputLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  input: {
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    padding: '0 10px',
    fontSize: '13px',
  },
  select: {
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    padding: '0 10px',
    fontSize: '13px',
  },
  textarea: {
    minHeight: '70px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    padding: '8px 10px',
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  },
  primaryAction: {
    alignSelf: 'flex-start',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  inviteRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '8px',
    alignItems: 'center',
  },
  messageComposer: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface-elevated)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  messageComposeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '8px',
    alignItems: 'center',
  },
  messagePanels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
  },
  messagePanel: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: '120px',
  },
  inboxRow: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface-elevated)',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    textAlign: 'left' as const,
  },
  secondaryAction: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorText: {
    margin: 0,
    color: '#FCA5A5',
    fontSize: '12px',
  },
  successText: {
    margin: 0,
    color: '#6EE7B7',
    fontSize: '12px',
  },
  socialColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  socialColumn: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface-elevated)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '120px',
  },
  subheading: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  },
  emptySmall: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  socialItem: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--surface)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  socialLine: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text)',
  },
  socialMeta: {
    margin: 0,
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  inlineActions: {
    display: 'flex',
    gap: '6px',
  },
  smallAction: {
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  smallActionGhost: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  feedSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  notFound: {
    textAlign: 'center' as const,
    padding: '64px 24px',
  },
  notFoundIcon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  notFoundTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  notFoundText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  backLink: {
    display: 'inline-block',
    marginTop: '24px',
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
