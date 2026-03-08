import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createEvent, getHostedEvents, type Event } from '@mylife/recipes';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const ACCENT = colors.modules.recipes;

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventsScreen() {
  const db = useDatabase();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(() => {
    setEvents(getHostedEvents(db));
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Missing Info', 'Enter an event title.');
      return;
    }
    const date = eventDate.trim() || new Date().toISOString().slice(0, 10);
    const time = eventTime.trim() || '18:00';

    createEvent(db, {
      id: uuid(),
      title: cleanTitle,
      eventDate: date,
      eventTime: time,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
    });
    setTitle('');
    setEventDate('');
    setEventTime('');
    setLocation('');
    setDescription('');
    setShowForm(false);
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.event_date >= today);
  const past = events.filter((e) => e.event_date < today);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Events</Text>
          <Pressable onPress={() => setShowForm(!showForm)}>
            <Text variant="label" color={ACCENT}>
              {showForm ? 'Cancel' : '+ New Event'}
            </Text>
          </Pressable>
        </View>

        {showForm ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={eventTime}
              onChangeText={setEventTime}
              placeholder="Time (HH:MM)"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location (optional)"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
            <Pressable style={styles.createButton} onPress={handleCreate}>
              <Text variant="label" color={colors.background}>Create Event</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      {upcoming.length > 0 ? (
        <Card>
          <Text variant="subheading">Upcoming</Text>
          {upcoming.map((event) => (
            <Pressable
              key={event.id}
              style={styles.eventRow}
              onPress={() => router.push(`/(recipes)/event/${event.id}`)}
            >
              <View style={styles.dateBadge}>
                <Text variant="caption" color={colors.background} style={styles.dateText}>
                  {new Date(`${event.event_date}T00:00:00`).getDate()}
                </Text>
                <Text variant="caption" color={colors.background} style={styles.monthText}>
                  {new Date(`${event.event_date}T00:00:00`).toLocaleString(undefined, { month: 'short' })}
                </Text>
              </View>
              <View style={styles.flex1}>
                <Text variant="body">{event.title}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {event.event_time}{event.location ? ` \u00B7 ${event.location}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {past.length > 0 ? (
        <Card>
          <Text variant="subheading">Past Events</Text>
          {past.map((event) => (
            <Pressable
              key={event.id}
              style={[styles.eventRow, styles.pastRow]}
              onPress={() => router.push(`/(recipes)/event/${event.id}`)}
            >
              <View style={styles.flex1}>
                <Text variant="body" color={colors.textSecondary}>{event.title}</Text>
                <Text variant="caption" color={colors.textTertiary}>
                  {formatDate(event.event_date)} {event.event_time}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {events.length === 0 && !showForm ? (
        <Card>
          <View style={styles.emptyState}>
            <Text variant="body" color={colors.textSecondary}>No events yet.</Text>
            <Text variant="caption" color={colors.textTertiary}>
              Plan potlucks, dinner parties, and gatherings.
            </Text>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  form: {
    marginTop: spacing.sm,
    gap: spacing.sm,
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pastRow: {
    opacity: 0.7,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  monthText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  flex1: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
});
