'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ensureActorIdentityAction,
  fetchBook,
  fetchFriendInvitesAction,
  fetchFriendsAction,
  fetchReviewForBook,
  fetchSessionsForBook,
  fetchTagsForBook,
  fetchVisibleBookShareEventsAction,
} from '../actions';
import { formatBookStatus, parseStoredList } from '../ui';

interface BookDetail {
  id: string;
  title: string;
  subtitle?: string | null;
  authors: string | null;
  publisher?: string | null;
  publish_year?: number | null;
  page_count?: number | null;
  description?: string | null;
  subjects?: string | null;
}

interface SessionSummary {
  id: string;
  status: string;
  current_page?: number | null;
}

interface ReviewSummary {
  rating?: number | null;
  review_text?: string | null;
  favorite_quote?: string | null;
}

interface TagSummary {
  id: string;
  name: string;
}

const DEMO_USER_ID = 'demo-alice';

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const bookId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [book, setBook] = useState<BookDetail | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [incomingInvitesCount, setIncomingInvitesCount] = useState(0);
  const [shareEventsCount, setShareEventsCount] = useState(0);

  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;

    void Promise.all([
      fetchBook(bookId),
      fetchSessionsForBook(bookId),
      fetchReviewForBook(bookId),
      fetchTagsForBook(bookId),
      ensureActorIdentityAction({ userId: DEMO_USER_ID }),
    ]).then(async ([nextBook, nextSessions, nextReview, nextTags, actorIdentity]) => {
      if (cancelled) return;
      setBook(nextBook as BookDetail | null);
      setSessions(nextSessions as SessionSummary[]);
      setReview(nextReview as ReviewSummary | null);
      setTags(nextTags as TagSummary[]);

      const [invites, friends, shareEvents] = await Promise.all([
        fetchFriendInvitesAction({ actorToken: actorIdentity.actorToken }),
        fetchFriendsAction(actorIdentity.actorToken),
        fetchVisibleBookShareEventsAction({
          viewerToken: actorIdentity.actorToken,
          objectId: bookId,
          limit: 20,
        }),
      ]);

      if (cancelled) return;
      setIncomingInvitesCount((invites as { incoming: unknown[] }).incoming.length);
      setFriendsCount((friends as unknown[]).length);
      setShareEventsCount((shareEvents as unknown[]).length);
    });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (book === undefined) {
    return <p style={{ color: '#6B5845' }}>Loading book details...</p>;
  }

  if (!book) {
    return (
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>Book not found</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845' }}>
          This title is not in your library yet.
        </p>
        <Link href="/books" style={{ display: 'inline-block', marginTop: 16, color: '#8C5A2B', fontWeight: 700 }}>
          Back to Library
        </Link>
      </section>
    );
  }

  const authors = parseStoredList(book.authors);
  const subjects = parseStoredList(book.subjects);
  const currentSession = sessions[0];

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(123, 83, 36, 0.12)',
          boxShadow: '0 16px 32px rgba(80, 54, 25, 0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 36 }}>{book.title}</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845', fontSize: 18 }}>
          by {authors.join(', ') || 'Unknown author'}
        </p>
        {book.subtitle ? (
          <p style={{ margin: '6px 0 0', color: '#8C5A2B', fontWeight: 700 }}>{book.subtitle}</p>
        ) : null}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          {book.publisher ? <span>{book.publisher}</span> : null}
          {book.publish_year ? <span>{book.publish_year}</span> : null}
          {book.page_count ? <span>{book.page_count} pages</span> : null}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <article
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid rgba(123, 83, 36, 0.12)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Reading status</h2>
          <p style={{ margin: '12px 0 0', fontWeight: 700 }}>
            {formatBookStatus(currentSession?.status)}
          </p>
          {currentSession?.current_page && book.page_count ? (
            <p style={{ margin: '6px 0 0', color: '#6B5845' }}>
              Page {currentSession.current_page} of {book.page_count}
            </p>
          ) : null}
          {book.description ? (
            <p style={{ margin: '18px 0 0', color: '#4D3A28', lineHeight: 1.6 }}>{book.description}</p>
          ) : null}
        </article>

        <article
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid rgba(123, 83, 36, 0.12)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Review</h2>
          {typeof review?.rating === 'number' ? (
            <p style={{ margin: '12px 0 0', fontWeight: 700 }}>{review.rating.toFixed(1)} / 5</p>
          ) : null}
          {review?.review_text ? (
            <p style={{ margin: '12px 0 0', lineHeight: 1.6 }}>{review.review_text}</p>
          ) : null}
          {review?.favorite_quote ? (
            <blockquote
              style={{
                margin: '16px 0 0',
                paddingLeft: 14,
                borderLeft: '3px solid #D7B58B',
                color: '#5D4733',
              }}
            >
              {review.favorite_quote}
            </blockquote>
          ) : null}
        </article>
      </section>

      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Tags and topics</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                backgroundColor: '#F5EEE6',
                color: '#6B5845',
                fontWeight: 700,
              }}
            >
              {tag.name}
            </span>
          ))}
          {subjects.map((subject) => (
            <span
              key={subject}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                backgroundColor: '#FFF8F0',
                color: '#8C5A2B',
              }}
            >
              {subject}
            </span>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Share and Friends</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ color: '#6B5845', fontWeight: 700 }}>Friends</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{friendsCount}</div>
          </div>
          <div>
            <div style={{ color: '#6B5845', fontWeight: 700 }}>Pending invites</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{incomingInvitesCount}</div>
          </div>
          <div>
            <div style={{ color: '#6B5845', fontWeight: 700 }}>Visible shares</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{shareEventsCount}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
