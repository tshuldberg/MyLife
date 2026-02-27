import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  addEventCohost,
  addPhoto,
  approveInviteRequest,
  createAnnouncement,
  createComment,
  createEvent,
  createInvite,
  createPoll,
  createQuestion,
  exportAttendanceCsv,
  getAnnouncementsByEvent,
  getCommentsByEvent,
  getEventAnalytics,
  getEventCohosts,
  getEventLinksByEvent,
  getEvents,
  getInvitesByEvent,
  getPhotosByEvent,
  getPollVotes,
  getPollsByEvent,
  getQuestionsByEvent,
  getRsvpSummary,
  getRsvpsByEvent,
  moveInviteToWaitlist,
  recordRsvp,
  saveQuestionResponse,
  setEventLink,
  type Event,
  type LinkType,
  type Poll,
  type Rsvp,
  type RsvpResponse,
  votePollOption,
  checkInRsvp,
} from '@mylife/rsvp';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const RSVP_OPTIONS: RsvpResponse[] = ['going', 'maybe', 'declined', 'waitlisted'];
const LINK_TYPES: LinkType[] = ['chip_in', 'registry', 'playlist', 'other'];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <Text variant="caption" color={colors.textSecondary}>
        {label}
      </Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  );
}

export default function RsvpScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartAt, setEventStartAt] = useState(new Date(Date.now() + 86400000).toISOString());
  const [eventLocation, setEventLocation] = useState('');

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
  const [commentMessage, setCommentMessage] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Host');
  const [photoUrl, setPhotoUrl] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('chip_in');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const events = useMemo(() => getEvents(db, { includePast: true }), [db, tick]);

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

  const selectedEvent = useMemo<Event | null>(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const cohosts = useMemo(
    () => (selectedEvent ? getEventCohosts(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const invites = useMemo(
    () => (selectedEvent ? getInvitesByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const rsvps = useMemo(
    () => (selectedEvent ? getRsvpsByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const questions = useMemo(
    () => (selectedEvent ? getQuestionsByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const polls = useMemo(
    () => (selectedEvent ? getPollsByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const announcements = useMemo(
    () => (selectedEvent ? getAnnouncementsByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const comments = useMemo(
    () => (selectedEvent ? getCommentsByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const photos = useMemo(
    () => (selectedEvent ? getPhotosByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );
  const links = useMemo(
    () => (selectedEvent ? getEventLinksByEvent(db, selectedEvent.id) : []),
    [db, selectedEvent, tick],
  );

  const summary = useMemo(
    () => (selectedEvent ? getRsvpSummary(db, selectedEvent.id) : null),
    [db, selectedEvent, tick],
  );
  const analytics = useMemo(
    () => (selectedEvent ? getEventAnalytics(db, selectedEvent.id) : null),
    [db, selectedEvent, tick],
  );

  const pollVotesById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPollVotes>>();
    if (!selectedEvent) return map;
    for (const poll of polls) {
      map.set(poll.id, getPollVotes(db, poll.id));
    }
    return map;
  }, [db, polls, selectedEvent, tick]);

  const csvPreview = useMemo(() => {
    if (!selectedEvent) return '';
    return exportAttendanceCsv(db, selectedEvent.id)
      .split('\n')
      .slice(0, 5)
      .join('\n');
  }, [db, selectedEvent, tick]);

  const createEventHandler = () => {
    const title = eventTitle.trim();
    if (!title) return;

    const id = uuid();
    createEvent(db, id, {
      title,
      startAt: eventStartAt.trim() || new Date().toISOString(),
      locationName: eventLocation.trim() || undefined,
      visibility: 'private',
      requiresApproval: true,
      waitlistEnabled: true,
      allowPlusOnes: true,
      allowPolls: true,
      allowPhotoAlbum: true,
      allowComments: true,
      allowChipIn: true,
      createdBy: 'Host',
    });

    setEventTitle('');
    setEventLocation('');
    setSelectedEventId(id);
    refresh();
  };

  const addCohostHandler = () => {
    if (!selectedEvent) return;
    const name = cohostName.trim();
    if (!name) return;
    addEventCohost(db, uuid(), selectedEvent.id, { name, role: 'Cohost' });
    setCohostName('');
    refresh();
  };

  const addInviteHandler = () => {
    if (!selectedEvent) return;
    const name = inviteName.trim();
    if (!name) return;

    createInvite(db, uuid(), selectedEvent.id, {
      inviteeName: name,
      inviteeContact: inviteContact.trim() || undefined,
      inviteeType: inviteContact.includes('@') ? 'email' : 'link',
      plusOneLimit: Math.max(0, Number(plusOneLimit) || 0),
      status: selectedEvent.requiresApproval ? 'requested' : 'invited',
    });

    setInviteName('');
    setInviteContact('');
    setPlusOneLimit('0');
    refresh();
  };

  const recordRsvpHandler = () => {
    if (!selectedEvent) return;
    const guestName = rsvpGuestName.trim();
    if (!guestName) return;

    const invite = invites.find(
      (row) => row.inviteeName.toLowerCase() === guestName.toLowerCase(),
    );

    recordRsvp(db, uuid(), selectedEvent.id, {
      inviteId: invite?.id,
      guestName,
      guestContact: invite?.inviteeContact ?? undefined,
      response: rsvpChoice,
      plusOnesCount: Math.max(0, Number(rsvpPlusOnes) || 0),
      source: 'app',
    });

    setRsvpGuestName('');
    setRsvpPlusOnes('0');
    refresh();
  };

  const addQuestionHandler = () => {
    if (!selectedEvent) return;
    const label = questionLabel.trim();
    if (!label) return;

    const questionId = uuid();
    createQuestion(db, questionId, selectedEvent.id, {
      label,
      type: 'text',
      required: false,
      sortOrder: questions.length,
    });

    if (questionAnswer.trim() && rsvps[0]) {
      saveQuestionResponse(
        db,
        uuid(),
        selectedEvent.id,
        rsvps[0].id,
        questionId,
        questionAnswer.trim(),
      );
    }

    setQuestionLabel('');
    setQuestionAnswer('');
    refresh();
  };

  const addPollHandler = () => {
    if (!selectedEvent) return;
    const question = pollQuestion.trim();
    const optionA = pollOptionA.trim();
    const optionB = pollOptionB.trim();
    if (!question || !optionA || !optionB) return;

    createPoll(db, uuid(), selectedEvent.id, {
      question,
      options: [
        { id: uuid(), label: optionA },
        { id: uuid(), label: optionB },
      ],
      multipleChoice: false,
    });

    setPollQuestion('');
    setPollOptionA('');
    setPollOptionB('');
    refresh();
  };

  const addAnnouncementHandler = () => {
    if (!selectedEvent) return;
    const message = announcementMessage.trim();
    if (!message) return;
    createAnnouncement(db, uuid(), selectedEvent.id, { message, sendChannel: 'all' });
    setAnnouncementMessage('');
    refresh();
  };

  const addCommentHandler = () => {
    if (!selectedEvent) return;
    const message = commentMessage.trim();
    if (!message) return;
    createComment(db, uuid(), selectedEvent.id, {
      guestName: commentAuthor.trim() || 'Guest',
      message,
      rsvpId: rsvps[0]?.id,
    });
    setCommentMessage('');
    refresh();
  };

  const addPhotoHandler = () => {
    if (!selectedEvent) return;
    const url = photoUrl.trim();
    if (!url) return;
    addPhoto(db, uuid(), selectedEvent.id, {
      guestName: commentAuthor.trim() || 'Guest',
      photoUrl: url,
      rsvpId: rsvps[0]?.id,
    });
    setPhotoUrl('');
    refresh();
  };

  const addLinkHandler = () => {
    if (!selectedEvent) return;
    const label = linkLabel.trim();
    const url = linkUrl.trim();
    if (!label || !url) return;
    setEventLink(db, uuid(), selectedEvent.id, {
      type: linkType,
      label,
      url,
    });
    setLinkLabel('');
    setLinkUrl('');
    refresh();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Create Event</Text>
        <View style={styles.formGrid}>
          <TextInput
            style={styles.input}
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder="Event title"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={eventStartAt}
            onChangeText={setEventStartAt}
            placeholder="Start time (ISO)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={eventLocation}
            onChangeText={setEventLocation}
            placeholder="Location"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable style={styles.primaryButton} onPress={createEventHandler}>
            <Text variant="label" color={colors.background}>Create Event</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text variant="subheading">Events</Text>
        <View style={styles.stackSm}>
          {events.map((event) => {
            const selected = event.id === selectedEvent?.id;
            return (
              <Pressable
                key={event.id}
                style={[styles.eventRow, selected ? styles.eventRowSelected : null]}
                onPress={() => setSelectedEventId(event.id)}
              >
                <View style={styles.mainCopy}>
                  <Text variant="body">{event.title}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {new Date(event.startAt).toLocaleString()} · {event.locationName ?? 'TBD'}
                  </Text>
                </View>
                <Text variant="caption" color={colors.textTertiary}>{event.visibility}</Text>
              </Pressable>
            );
          })}
          {events.length === 0 ? (
            <Text variant="caption" color={colors.textSecondary}>
              No events yet.
            </Text>
          ) : null}
        </View>
      </Card>

      {selectedEvent && summary && analytics ? (
        <>
          <View style={styles.metricsGrid}>
            <Stat label="Invited" value={String(summary.invited + summary.approved)} />
            <Stat label="Going" value={String(summary.going)} />
            <Stat label="Waitlist" value={String(summary.waitlisted)} />
            <Stat label="Checked In" value={String(summary.checkedIn)} />
            <Stat label="Response Rate" value={`${Math.round(analytics.responseRate * 100)}%`} />
            <Stat label="Plus Ones" value={String(summary.plusOnes)} />
          </View>

          <Card>
            <Text variant="subheading">Guest List Controls</Text>
            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                value={cohostName}
                onChangeText={setCohostName}
                placeholder="Add cohost"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.secondaryButton} onPress={addCohostHandler}>
                <Text variant="label" color={colors.text}>Add Cohost</Text>
              </Pressable>

              <TextInput
                style={styles.input}
                value={inviteName}
                onChangeText={setInviteName}
                placeholder="Invite name"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={inviteContact}
                onChangeText={setInviteContact}
                placeholder="Email/SMS"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={plusOneLimit}
                onChangeText={setPlusOneLimit}
                placeholder="+1 limit"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Pressable style={styles.primaryButton} onPress={addInviteHandler}>
                <Text variant="label" color={colors.background}>Add Invite</Text>
              </Pressable>
            </View>

            <View style={styles.stackSm}>
              {cohosts.map((cohost) => (
                <Text key={cohost.id} variant="caption" color={colors.textSecondary}>
                  Cohost: {cohost.name}
                </Text>
              ))}
              {invites.map((invite) => (
                <View key={invite.id} style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{invite.inviteeName}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {invite.status} · +{invite.plusOneLimit}
                    </Text>
                  </View>
                  <View style={styles.rowGap}>
                    <Pressable
                      style={styles.smallButton}
                      onPress={() => {
                        approveInviteRequest(db, invite.id);
                        refresh();
                      }}
                    >
                      <Text variant="caption" color={colors.text}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={styles.smallButton}
                      onPress={() => {
                        moveInviteToWaitlist(db, invite.id);
                        refresh();
                      }}
                    >
                      <Text variant="caption" color={colors.text}>Waitlist</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text variant="subheading">RSVP and Check-In</Text>
            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                value={rsvpGuestName}
                onChangeText={setRsvpGuestName}
                placeholder="Guest name"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.rowGapWrap}>
                {RSVP_OPTIONS.map((option) => {
                  const selected = option === rsvpChoice;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                      onPress={() => setRsvpChoice(option)}
                    >
                      <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={styles.input}
                value={rsvpPlusOnes}
                onChangeText={setRsvpPlusOnes}
                placeholder="Plus ones"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Pressable style={styles.primaryButton} onPress={recordRsvpHandler}>
                <Text variant="label" color={colors.background}>Record RSVP</Text>
              </Pressable>
            </View>

            <View style={styles.stackSm}>
              {rsvps.map((rsvp) => (
                <View key={rsvp.id} style={styles.rowBetween}>
                  <View style={styles.mainCopy}>
                    <Text variant="body">{rsvp.guestName}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {rsvp.response} · +{rsvp.plusOnesCount}
                      {rsvp.checkedInAt ? ' · checked-in' : ''}
                    </Text>
                  </View>
                  {!rsvp.checkedInAt ? (
                    <Pressable
                      style={styles.smallButton}
                      onPress={() => {
                        checkInRsvp(db, rsvp.id);
                        refresh();
                      }}
                    >
                      <Text variant="caption" color={colors.text}>Check In</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text variant="subheading">Questions and Polls</Text>
            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                value={questionLabel}
                onChangeText={setQuestionLabel}
                placeholder="Custom question"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={questionAnswer}
                onChangeText={setQuestionAnswer}
                placeholder="Answer for first RSVP"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.secondaryButton} onPress={addQuestionHandler}>
                <Text variant="label" color={colors.text}>Add Question</Text>
              </Pressable>

              <TextInput
                style={styles.input}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                placeholder="Poll question"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={pollOptionA}
                onChangeText={setPollOptionA}
                placeholder="Option A"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={pollOptionB}
                onChangeText={setPollOptionB}
                placeholder="Option B"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.primaryButton} onPress={addPollHandler}>
                <Text variant="label" color={colors.background}>Create Poll</Text>
              </Pressable>
            </View>

            <View style={styles.stackSm}>
              {questions.map((question) => (
                <Text key={question.id} variant="caption" color={colors.textSecondary}>
                  Q: {question.label}
                </Text>
              ))}

              {polls.map((poll: Poll) => {
                const votes = pollVotesById.get(poll.id) ?? [];
                return (
                  <View key={poll.id} style={styles.pollCard}>
                    <Text variant="body">{poll.question}</Text>
                    <View style={styles.rowGapWrap}>
                      {poll.options.map((option) => {
                        const count = votes.filter((vote) => vote.optionId === option.id).length;
                        return (
                          <Pressable
                            key={option.id}
                            style={styles.smallButton}
                            onPress={() => {
                              votePollOption(db, uuid(), poll.id, {
                                optionId: option.id,
                                rsvpId: rsvps[0]?.id,
                                guestName: rsvps[0] ? undefined : commentAuthor.trim() || 'Guest',
                              });
                              refresh();
                            }}
                          >
                            <Text variant="caption" color={colors.text}>
                              {option.label} ({count})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text variant="subheading">Feed, Album, Links</Text>
            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                value={announcementMessage}
                onChangeText={setAnnouncementMessage}
                placeholder="Announcement / text blast"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.secondaryButton} onPress={addAnnouncementHandler}>
                <Text variant="label" color={colors.text}>Post Announcement</Text>
              </Pressable>

              <TextInput
                style={styles.input}
                value={commentAuthor}
                onChangeText={setCommentAuthor}
                placeholder="Comment author"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={commentMessage}
                onChangeText={setCommentMessage}
                placeholder="Comment"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.secondaryButton} onPress={addCommentHandler}>
                <Text variant="label" color={colors.text}>Add Comment</Text>
              </Pressable>

              <TextInput
                style={styles.input}
                value={photoUrl}
                onChangeText={setPhotoUrl}
                placeholder="Photo URL"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.secondaryButton} onPress={addPhotoHandler}>
                <Text variant="label" color={colors.text}>Add Photo</Text>
              </Pressable>

              <View style={styles.rowGapWrap}>
                {LINK_TYPES.map((type) => {
                  const selected = type === linkType;
                  return (
                    <Pressable
                      key={type}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                      onPress={() => setLinkType(type)}
                    >
                      <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={styles.input}
                value={linkLabel}
                onChangeText={setLinkLabel}
                placeholder="Link label"
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholder="Link URL"
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable style={styles.primaryButton} onPress={addLinkHandler}>
                <Text variant="label" color={colors.background}>Add Link</Text>
              </Pressable>
            </View>

            <View style={styles.stackSm}>
              <Text variant="caption" color={colors.textSecondary}>
                Announcements: {announcements.length} · Comments: {comments.length} · Photos: {photos.length}
              </Text>
              {links.slice(0, 4).map((link) => (
                <Text key={link.id} variant="caption" color={colors.textSecondary}>
                  {link.type}: {link.label}
                </Text>
              ))}
            </View>
          </Card>

          <Card>
            <Text variant="subheading">Attendance CSV Preview</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {csvPreview || 'No attendance rows yet.'}
            </Text>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  formGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '31.5%',
    minWidth: 96,
    gap: spacing.xs,
  },
  statValue: {
    color: colors.modules.rsvp,
    fontSize: 19,
    fontWeight: '700',
  },
  stackSm: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: colors.modules.rsvp,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  eventRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eventRowSelected: {
    borderColor: colors.modules.rsvp,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mainCopy: {
    flex: 1,
    gap: 2,
  },
  rowGap: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rowGapWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  smallButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipSelected: {
    borderColor: colors.modules.rsvp,
    backgroundColor: colors.modules.rsvp,
  },
  pollCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    gap: spacing.xs,
  },
});
