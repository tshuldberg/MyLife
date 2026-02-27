'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Event,
  EventLink,
  Poll,
  PollOption,
  PollVote,
  Rsvp,
  RsvpResponse,
  LinkType,
} from '@mylife/rsvp';
import {
  doAddCohost,
  doAddInvite,
  doAddLink,
  doAddPhoto,
  doApproveInvite,
  doCheckInRsvp,
  doCreateAnnouncement,
  doCreateComment,
  doCreateEvent,
  doCreatePoll,
  doCreateQuestion,
  doRecordRsvp,
  doSaveQuestionResponse,
  doVotePollOption,
  doWaitlistInvite,
  exportAttendanceCsvAction,
  fetchEventBundle,
  fetchEvents,
  fetchPollVotes,
} from './actions';

const RSVP_OPTIONS: RsvpResponse[] = ['going', 'maybe', 'declined', 'waitlisted'];
const LINK_TYPES: LinkType[] = ['chip_in', 'registry', 'playlist', 'other'];

type EventBundle = Awaited<ReturnType<typeof fetchEventBundle>>;

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function RsvpPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<EventBundle | null>(null);
  const [pollVotesById, setPollVotesById] = useState<Record<string, PollVote[]>>({});
  const [csvPreview, setCsvPreview] = useState('');

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartAt, setEventStartAt] = useState(new Date(Date.now() + 86400000).toISOString());
  const [eventLocation, setEventLocation] = useState('');

  const [cohostName, setCohostName] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteContact, setInviteContact] = useState('');
  const [plusOneLimit, setPlusOneLimit] = useState('0');

  const [rsvpGuestName, setRsvpGuestName] = useState('');
  const [rsvpChoice, setRsvpChoice] = useState<RsvpResponse>('going');
  const [rsvpPlusOnes, setRsvpPlusOnes] = useState('0');

  const [questionLabel, setQuestionLabel] = useState('');
  const [questionAnswer, setQuestionAnswer] = useState('');

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionA, setPollOptionA] = useState('');
  const [pollOptionB, setPollOptionB] = useState('');

  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Host');
  const [commentMessage, setCommentMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('chip_in');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const loadEvents = useCallback(async () => {
    const nextEvents = await fetchEvents();
    setEvents(nextEvents);
  }, []);

  const loadBundle = useCallback(async (eventId: string) => {
    const nextBundle = await fetchEventBundle(eventId);
    setBundle(nextBundle);

    const votesEntries = await Promise.all(
      nextBundle.polls.map(async (poll) => [poll.id, await fetchPollVotes(poll.id)] as const),
    );
    setPollVotesById(Object.fromEntries(votesEntries));

    const csv = await exportAttendanceCsvAction(eventId);
    setCsvPreview(
      csv
        .split('\n')
        .slice(0, 5)
        .join('\n'),
    );
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (events.length === 0) {
      if (selectedEventId !== null) {
        setSelectedEventId(null);
      }
      return;
    }

    if (!selectedEventId || !events.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) {
      setBundle(null);
      setPollVotesById({});
      setCsvPreview('');
      return;
    }

    void loadBundle(selectedEventId);
  }, [loadBundle, selectedEventId]);

  const createEventHandler = async () => {
    const title = eventTitle.trim();
    if (!title) return;

    const eventId = makeId();
    await doCreateEvent(eventId, {
      title,
      startAt: eventStartAt.trim() || new Date().toISOString(),
      locationName: eventLocation.trim() || undefined,
    });

    setEventTitle('');
    setEventLocation('');
    await loadEvents();
    setSelectedEventId(eventId);
  };

  const addCohostHandler = async () => {
    if (!selectedEvent) return;
    const name = cohostName.trim();
    if (!name) return;

    await doAddCohost(makeId(), selectedEvent.id, name);
    setCohostName('');
    await loadBundle(selectedEvent.id);
  };

  const addInviteHandler = async () => {
    if (!selectedEvent) return;
    const inviteeName = inviteName.trim();
    if (!inviteeName) return;

    await doAddInvite(makeId(), selectedEvent.id, {
      inviteeName,
      inviteeContact: inviteContact.trim() || undefined,
      plusOneLimit: Math.max(0, Number(plusOneLimit) || 0),
    });

    setInviteName('');
    setInviteContact('');
    setPlusOneLimit('0');
    await loadBundle(selectedEvent.id);
  };

  const addRsvpHandler = async () => {
    if (!selectedEvent || !bundle) return;
    const guestName = rsvpGuestName.trim();
    if (!guestName) return;

    const invite = bundle.invites.find(
      (row) => row.inviteeName.toLowerCase() === guestName.toLowerCase(),
    );

    await doRecordRsvp(makeId(), selectedEvent.id, {
      inviteId: invite?.id,
      guestName,
      guestContact: invite?.inviteeContact ?? undefined,
      response: rsvpChoice,
      plusOnesCount: Math.max(0, Number(rsvpPlusOnes) || 0),
    });

    setRsvpGuestName('');
    setRsvpPlusOnes('0');
    await loadBundle(selectedEvent.id);
  };

  const addQuestionHandler = async () => {
    if (!selectedEvent || !bundle) return;
    const label = questionLabel.trim();
    if (!label) return;

    const questionId = makeId();
    await doCreateQuestion(questionId, selectedEvent.id, { label });

    if (questionAnswer.trim() && bundle.rsvps[0]) {
      await doSaveQuestionResponse(
        makeId(),
        selectedEvent.id,
        bundle.rsvps[0].id,
        questionId,
        questionAnswer.trim(),
      );
    }

    setQuestionLabel('');
    setQuestionAnswer('');
    await loadBundle(selectedEvent.id);
  };

  const addPollHandler = async () => {
    if (!selectedEvent) return;
    const question = pollQuestion.trim();
    const optionA = pollOptionA.trim();
    const optionB = pollOptionB.trim();
    if (!question || !optionA || !optionB) return;

    const options: PollOption[] = [
      { id: makeId(), label: optionA },
      { id: makeId(), label: optionB },
    ];

    await doCreatePoll(makeId(), selectedEvent.id, { question, options });

    setPollQuestion('');
    setPollOptionA('');
    setPollOptionB('');
    await loadBundle(selectedEvent.id);
  };

  const addAnnouncementHandler = async () => {
    if (!selectedEvent) return;
    const message = announcementMessage.trim();
    if (!message) return;

    await doCreateAnnouncement(makeId(), selectedEvent.id, message);
    setAnnouncementMessage('');
    await loadBundle(selectedEvent.id);
  };

  const addCommentHandler = async () => {
    if (!selectedEvent || !bundle) return;
    const message = commentMessage.trim();
    if (!message) return;

    await doCreateComment(makeId(), selectedEvent.id, {
      guestName: commentAuthor.trim() || 'Guest',
      message,
      rsvpId: bundle.rsvps[0]?.id,
    });

    setCommentMessage('');
    await loadBundle(selectedEvent.id);
  };

  const addPhotoHandler = async () => {
    if (!selectedEvent || !bundle) return;
    const url = photoUrl.trim();
    if (!url) return;

    await doAddPhoto(makeId(), selectedEvent.id, {
      guestName: commentAuthor.trim() || 'Guest',
      photoUrl: url,
      rsvpId: bundle.rsvps[0]?.id,
    });

    setPhotoUrl('');
    await loadBundle(selectedEvent.id);
  };

  const addLinkHandler = async () => {
    if (!selectedEvent) return;
    const label = linkLabel.trim();
    const url = linkUrl.trim();
    if (!label || !url) return;

    await doAddLink(makeId(), selectedEvent.id, {
      type: linkType,
      label,
      url,
    });

    setLinkLabel('');
    setLinkUrl('');
    await loadBundle(selectedEvent.id);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>MyRSVP</h1>
        <p style={styles.subtitle}>Partiful-style event planning and guest management</p>
      </header>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Create Event</h2>
        <div style={styles.formGrid}>
          <input
            style={styles.input}
            value={eventTitle}
            onChange={(event) => setEventTitle(event.target.value)}
            placeholder="Event title"
          />
          <input
            style={styles.input}
            value={eventStartAt}
            onChange={(event) => setEventStartAt(event.target.value)}
            placeholder="Start time (ISO)"
          />
          <input
            style={styles.input}
            value={eventLocation}
            onChange={(event) => setEventLocation(event.target.value)}
            placeholder="Location"
          />
          <button style={styles.btnPrimary} onClick={() => void createEventHandler()}>
            Create Event
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Events</h2>
        <div style={styles.stackSm}>
          {events.map((event) => {
            const active = event.id === selectedEventId;
            return (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                style={active ? styles.eventRowActive : styles.eventRow}
              >
                <div style={styles.mainCopy}>
                  <div style={styles.rowTitle}>{event.title}</div>
                  <div style={styles.rowMeta}>
                    {new Date(event.startAt).toLocaleString()} · {event.locationName ?? 'TBD'}
                  </div>
                </div>
                <span style={styles.badge}>{event.visibility}</span>
              </button>
            );
          })}
          {events.length === 0 ? <div style={styles.rowMeta}>No events yet.</div> : null}
        </div>
      </section>

      {selectedEvent && bundle ? (
        <>
          <section style={styles.metricGrid}>
            <Metric label="Invited" value={String(bundle.summary.invited + bundle.summary.approved)} />
            <Metric label="Going" value={String(bundle.summary.going)} />
            <Metric label="Waitlist" value={String(bundle.summary.waitlisted)} />
            <Metric label="Checked In" value={String(bundle.summary.checkedIn)} />
            <Metric label="Response Rate" value={`${Math.round(bundle.analytics.responseRate * 100)}%`} />
            <Metric label="Plus Ones" value={String(bundle.summary.plusOnes)} />
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Guest List Controls</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                value={cohostName}
                onChange={(event) => setCohostName(event.target.value)}
                placeholder="Add cohost"
              />
              <button style={styles.btnGhost} onClick={() => void addCohostHandler()}>
                Add Cohost
              </button>

              <input
                style={styles.input}
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Invite name"
              />
              <input
                style={styles.input}
                value={inviteContact}
                onChange={(event) => setInviteContact(event.target.value)}
                placeholder="Email/SMS"
              />
              <input
                style={styles.input}
                value={plusOneLimit}
                onChange={(event) => setPlusOneLimit(event.target.value)}
                placeholder="+1 limit"
              />
              <button style={styles.btnPrimary} onClick={() => void addInviteHandler()}>
                Add Invite
              </button>
            </div>

            <div style={styles.stackSm}>
              {bundle.cohosts.map((cohost) => (
                <div key={cohost.id} style={styles.rowMeta}>
                  Cohost: {cohost.name}
                </div>
              ))}

              {bundle.invites.map((invite) => (
                <div key={invite.id} style={styles.rowBetween}>
                  <div style={styles.mainCopy}>
                    <div style={styles.rowTitle}>{invite.inviteeName}</div>
                    <div style={styles.rowMeta}>
                      {invite.status} · +{invite.plusOneLimit}
                    </div>
                  </div>
                  <div style={styles.inlineActions}>
                    <button
                      style={styles.btnGhost}
                      onClick={async () => {
                        await doApproveInvite(invite.id);
                        await loadBundle(selectedEvent.id);
                      }}
                    >
                      Approve
                    </button>
                    <button
                      style={styles.btnGhost}
                      onClick={async () => {
                        await doWaitlistInvite(invite.id);
                        await loadBundle(selectedEvent.id);
                      }}
                    >
                      Waitlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>RSVP and Check-In</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                value={rsvpGuestName}
                onChange={(event) => setRsvpGuestName(event.target.value)}
                placeholder="Guest name"
              />
              <div style={styles.chipRow}>
                {RSVP_OPTIONS.map((option) => (
                  <button
                    key={option}
                    style={option === rsvpChoice ? styles.chipActive : styles.chip}
                    onClick={() => setRsvpChoice(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <input
                style={styles.input}
                value={rsvpPlusOnes}
                onChange={(event) => setRsvpPlusOnes(event.target.value)}
                placeholder="Plus ones"
              />
              <button style={styles.btnPrimary} onClick={() => void addRsvpHandler()}>
                Record RSVP
              </button>
            </div>

            <div style={styles.stackSm}>
              {bundle.rsvps.map((rsvp: Rsvp) => (
                <div key={rsvp.id} style={styles.rowBetween}>
                  <div style={styles.mainCopy}>
                    <div style={styles.rowTitle}>{rsvp.guestName}</div>
                    <div style={styles.rowMeta}>
                      {rsvp.response} · +{rsvp.plusOnesCount}
                      {rsvp.checkedInAt ? ' · checked-in' : ''}
                    </div>
                  </div>
                  {!rsvp.checkedInAt ? (
                    <button
                      style={styles.btnGhost}
                      onClick={async () => {
                        await doCheckInRsvp(rsvp.id);
                        await loadBundle(selectedEvent.id);
                      }}
                    >
                      Check In
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Questions and Polls</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                value={questionLabel}
                onChange={(event) => setQuestionLabel(event.target.value)}
                placeholder="Custom question"
              />
              <input
                style={styles.input}
                value={questionAnswer}
                onChange={(event) => setQuestionAnswer(event.target.value)}
                placeholder="Answer for first RSVP"
              />
              <button style={styles.btnGhost} onClick={() => void addQuestionHandler()}>
                Add Question
              </button>

              <input
                style={styles.input}
                value={pollQuestion}
                onChange={(event) => setPollQuestion(event.target.value)}
                placeholder="Poll question"
              />
              <input
                style={styles.input}
                value={pollOptionA}
                onChange={(event) => setPollOptionA(event.target.value)}
                placeholder="Option A"
              />
              <input
                style={styles.input}
                value={pollOptionB}
                onChange={(event) => setPollOptionB(event.target.value)}
                placeholder="Option B"
              />
              <button style={styles.btnPrimary} onClick={() => void addPollHandler()}>
                Create Poll
              </button>
            </div>

            <div style={styles.stackSm}>
              {bundle.questions.map((question) => (
                <div key={question.id} style={styles.rowMeta}>Q: {question.label}</div>
              ))}

              {bundle.polls.map((poll: Poll) => {
                const votes = pollVotesById[poll.id] ?? [];
                return (
                  <div key={poll.id} style={styles.pollCard}>
                    <div style={styles.rowTitle}>{poll.question}</div>
                    <div style={styles.chipRow}>
                      {poll.options.map((option) => {
                        const count = votes.filter((vote) => vote.optionId === option.id).length;
                        return (
                          <button
                            key={option.id}
                            style={styles.btnGhost}
                            onClick={async () => {
                              await doVotePollOption(makeId(), poll.id, {
                                optionId: option.id,
                                rsvpId: bundle.rsvps[0]?.id,
                                guestName: bundle.rsvps[0] ? undefined : commentAuthor,
                              });
                              await loadBundle(selectedEvent.id);
                            }}
                          >
                            {option.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Feed, Album, Links</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                value={announcementMessage}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                placeholder="Announcement / text blast"
              />
              <button style={styles.btnGhost} onClick={() => void addAnnouncementHandler()}>
                Post Announcement
              </button>

              <input
                style={styles.input}
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
                placeholder="Comment author"
              />
              <input
                style={styles.input}
                value={commentMessage}
                onChange={(event) => setCommentMessage(event.target.value)}
                placeholder="Comment"
              />
              <button style={styles.btnGhost} onClick={() => void addCommentHandler()}>
                Add Comment
              </button>

              <input
                style={styles.input}
                value={photoUrl}
                onChange={(event) => setPhotoUrl(event.target.value)}
                placeholder="Photo URL"
              />
              <button style={styles.btnGhost} onClick={() => void addPhotoHandler()}>
                Add Photo
              </button>

              <div style={styles.chipRow}>
                {LINK_TYPES.map((type) => (
                  <button
                    key={type}
                    style={type === linkType ? styles.chipActive : styles.chip}
                    onClick={() => setLinkType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <input
                style={styles.input}
                value={linkLabel}
                onChange={(event) => setLinkLabel(event.target.value)}
                placeholder="Link label"
              />
              <input
                style={styles.input}
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="Link URL"
              />
              <button style={styles.btnPrimary} onClick={() => void addLinkHandler()}>
                Add Link
              </button>
            </div>

            <div style={styles.stackSm}>
              <div style={styles.rowMeta}>
                Announcements: {bundle.announcements.length} · Comments: {bundle.comments.length} · Photos: {bundle.photos.length}
              </div>
              {bundle.links.slice(0, 4).map((link: EventLink) => (
                <div key={link.id} style={styles.rowMeta}>
                  {link.type}: {link.label}
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Attendance CSV Preview</h2>
            <pre style={styles.csv}>{csvPreview || 'No attendance rows yet.'}</pre>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem',
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: {
    marginBottom: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  subtitle: {
    marginTop: '0.35rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
  },
  sectionTitle: {
    margin: 0,
    marginBottom: '0.75rem',
    fontSize: '1rem',
    color: 'var(--text)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.6rem',
    alignItems: 'center',
  },
  input: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '0.55rem 0.7rem',
    fontSize: '0.88rem',
  },
  btnPrimary: {
    background: 'var(--accent-rsvp, #FB7185)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#111',
    fontWeight: 700,
    padding: '0.55rem 0.8rem',
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '0.55rem 0.8rem',
    cursor: 'pointer',
  },
  eventRow: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.65rem 0.8rem',
    cursor: 'pointer',
  },
  eventRowActive: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'var(--surface-elevated)',
    border: '1px solid var(--accent-rsvp, #FB7185)',
    borderRadius: 'var(--radius-md)',
    padding: '0.65rem 0.8rem',
    cursor: 'pointer',
  },
  mainCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  rowTitle: {
    color: 'var(--text)',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  rowMeta: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  badge: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-tertiary)',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.7rem',
  },
  metricCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '0.8rem',
  },
  metricLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.73rem',
  },
  metricValue: {
    color: 'var(--accent-rsvp, #FB7185)',
    fontSize: '1.2rem',
    fontWeight: 700,
    marginTop: '0.2rem',
  },
  stackSm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    marginTop: '0.75rem',
  },
  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.6rem',
  },
  inlineActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: {
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    padding: '0.4rem 0.65rem',
    cursor: 'pointer',
  },
  chipActive: {
    borderRadius: '999px',
    border: '1px solid var(--accent-rsvp, #FB7185)',
    background: 'var(--accent-rsvp, #FB7185)',
    color: '#111',
    padding: '0.4rem 0.65rem',
    cursor: 'pointer',
  },
  pollCard: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-elevated)',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  csv: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
};
