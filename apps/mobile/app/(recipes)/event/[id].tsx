import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addEventGuest,
  getEventAllergyWarnings,
  getRecipes,
  setEventMenu,
  type Event,
  type Recipe,
} from '@mylife/recipes';
import type { DatabaseAdapter } from '@mylife/db';

interface EventGuestRow {
  id: string;
  event_id: string;
  name: string;
  contact: string | null;
  dietary_preferences: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
}

interface AllergyWarning {
  guest_name: string;
  allergy: string;
  recipe_id: string;
  recipe_title: string;
  ingredient: string;
}
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../../components/DatabaseProvider';
import { uuid } from '../../../lib/uuid';

const ACCENT = colors.modules.recipes;

function getEvent(db: DatabaseAdapter, id: string): Event | null {
  const rows = db.query<Event>(
    `SELECT id, title, event_date, event_time, location, description, capacity, invite_token, created_at, updated_at
     FROM ev_events
     WHERE id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

function getGuests(db: DatabaseAdapter, eventId: string): EventGuestRow[] {
  return db.query<EventGuestRow>(
    `SELECT id, event_id, name, contact, dietary_preferences, allergies, created_at, updated_at
     FROM ev_guests
     WHERE event_id = ?
     ORDER BY created_at ASC`,
    [eventId],
  );
}

function getRsvpSummary(
  db: DatabaseAdapter,
  eventId: string,
): { attending: number; maybe: number; declined: number } {
  const summary = { attending: 0, maybe: 0, declined: 0 };
  const rows = db.query<{ response: string; total: number }>(
    `SELECT response, COUNT(*) AS total
     FROM ev_rsvps
     WHERE event_id = ?
     GROUP BY response`,
    [eventId],
  );
  for (const row of rows) {
    if (row.response in summary) {
      summary[row.response as keyof typeof summary] = row.total;
    }
  }
  return summary;
}

function getMenuItems(
  db: DatabaseAdapter,
  eventId: string,
): Array<{ recipe_id: string; recipe_title: string; servings: number; course: string }> {
  return db.query<{ recipe_id: string; recipe_title: string; servings: number; course: string }>(
    `SELECT m.recipe_id, r.title AS recipe_title, m.servings, m.course
     FROM ev_menu_items m
     JOIN rc_recipes r ON r.id = m.recipe_id
     WHERE m.event_id = ?
     ORDER BY m.created_at ASC`,
    [eventId],
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<EventGuestRow[]>([]);
  const [rsvp, setRsvp] = useState({ attending: 0, maybe: 0, declined: 0 });
  const [menu, setMenu] = useState<
    Array<{ recipe_id: string; recipe_title: string; servings: number; course: string }>
  >([]);
  const [warnings, setWarnings] = useState<AllergyWarning[]>([]);

  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAllergies, setGuestAllergies] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    setEvent(getEvent(db, id));
    setGuests(getGuests(db, id));
    setRsvp(getRsvpSummary(db, id));
    setMenu(getMenuItems(db, id));
    setWarnings(getEventAllergyWarnings(db, id));
  }, [db, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddGuest = () => {
    const name = guestName.trim();
    if (!name || !id) return;
    addEventGuest(db, {
      id: uuid(),
      eventId: id,
      name,
      allergies: guestAllergies.trim() || undefined,
    });
    setGuestName('');
    setGuestAllergies('');
    setShowAddGuest(false);
    load();
  };

  const handleAddToMenu = () => {
    if (!id) return;
    const recipes = getRecipes(db, { limit: 20 });
    if (recipes.length === 0) {
      Alert.alert('No Recipes', 'Add some recipes first.');
      return;
    }
    Alert.alert('Add to Menu', 'Choose a recipe', [
      ...recipes.slice(0, 10).map((r: Recipe) => ({
        text: r.title,
        onPress: () => {
          const currentIds = menu.map((m) => m.recipe_id);
          currentIds.push(r.id);
          setEventMenu(db, { eventId: id, recipeIds: currentIds, servings: 4 });
          load();
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (id) {
            db.execute(`DELETE FROM ev_events WHERE id = ?`, [id]);
            router.back();
          }
        },
      },
    ]);
  };

  if (!event) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <Text variant="body" color={colors.textSecondary}>Event not found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text variant="body" color={colors.textSecondary}>
          {formatDate(event.event_date)} at {event.event_time}
        </Text>
        {event.location ? (
          <Text variant="caption" color={colors.textSecondary}>
            {event.location}
          </Text>
        ) : null}
        {event.description ? (
          <Text variant="body" color={colors.textSecondary} style={styles.eventDescription}>
            {event.description}
          </Text>
        ) : null}
      </Card>

      {/* RSVP Summary */}
      <View style={styles.rsvpGrid}>
        <Card style={styles.rsvpCard}>
          <Text variant="caption" color={colors.textSecondary}>Attending</Text>
          <Text style={[styles.rsvpCount, { color: colors.success }]}>{rsvp.attending}</Text>
        </Card>
        <Card style={styles.rsvpCard}>
          <Text variant="caption" color={colors.textSecondary}>Maybe</Text>
          <Text style={[styles.rsvpCount, { color: ACCENT }]}>{rsvp.maybe}</Text>
        </Card>
        <Card style={styles.rsvpCard}>
          <Text variant="caption" color={colors.textSecondary}>Declined</Text>
          <Text style={[styles.rsvpCount, { color: colors.danger }]}>{rsvp.declined}</Text>
        </Card>
      </View>

      {/* Invite Token */}
      {event.invite_token ? (
        <Card>
          <Text variant="subheading">Invite Code</Text>
          <Text variant="body" color={ACCENT} style={styles.inviteToken}>
            {event.invite_token}
          </Text>
          <Text variant="caption" color={colors.textTertiary}>
            Share this code so guests can RSVP.
          </Text>
        </Card>
      ) : null}

      {/* Menu */}
      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Menu</Text>
          <Pressable onPress={handleAddToMenu}>
            <Text variant="label" color={ACCENT}>+ Add</Text>
          </Pressable>
        </View>
        {menu.length > 0 ? (
          menu.map((item, i) => (
            <View key={`${item.recipe_id}-${i}`} style={styles.menuRow}>
              <Text variant="body">{item.recipe_title}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                {item.course} {'\u00B7'} {item.servings} servings
              </Text>
            </View>
          ))
        ) : (
          <Text variant="caption" color={colors.textSecondary}>No menu items yet.</Text>
        )}
      </Card>

      {/* Allergy Warnings */}
      {warnings.length > 0 ? (
        <Card>
          <Text variant="subheading" color={colors.danger}>Allergy Warnings</Text>
          {warnings.map((w, i) => (
            <View key={i} style={styles.warningRow}>
              <Text variant="body" color={colors.danger}>
                {w.guest_name}: {w.allergy}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Found "{w.ingredient}" in {w.recipe_title}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Guests */}
      <Card>
        <View style={styles.rowBetween}>
          <Text variant="subheading">Guests ({guests.length})</Text>
          <Pressable onPress={() => setShowAddGuest(!showAddGuest)}>
            <Text variant="label" color={ACCENT}>
              {showAddGuest ? 'Cancel' : '+ Add'}
            </Text>
          </Pressable>
        </View>

        {showAddGuest ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Guest name"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={guestAllergies}
              onChangeText={setGuestAllergies}
              placeholder="Allergies (comma-separated, optional)"
              placeholderTextColor={colors.textTertiary}
            />
            <Pressable style={styles.addButton} onPress={handleAddGuest}>
              <Text variant="label" color={colors.background}>Add Guest</Text>
            </Pressable>
          </View>
        ) : null}

        {guests.map((guest) => (
          <View key={guest.id} style={styles.guestRow}>
            <Text variant="body">{guest.name}</Text>
            {guest.allergies ? (
              <Text variant="caption" color={colors.textSecondary}>
                Allergies: {guest.allergies}
              </Text>
            ) : null}
          </View>
        ))}
        {guests.length === 0 && !showAddGuest ? (
          <Text variant="caption" color={colors.textSecondary}>No guests added yet.</Text>
        ) : null}
      </Card>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text variant="label" color={colors.background}>Delete Event</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  eventDescription: {
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  rsvpGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rsvpCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  rsvpCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  inviteToken: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  warningRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  addButton: {
    borderRadius: 8,
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  guestRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deleteButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
