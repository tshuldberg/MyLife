import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { SurfSession, SurfSpot } from '@mylife/surf';
import {
  createSession,
  deleteSession,
  getSessions,
  getSpots,
} from '@mylife/surf';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function SurfSessionsScreen() {
  const db = useDatabase();

  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [sessions, setSessions] = useState<SurfSession[]>([]);

  const [spotId, setSpotId] = useState('');
  const [durationMin, setDurationMin] = useState('90');
  const [rating, setRating] = useState('4');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(() => {
    const nextSpots = getSpots(db);
    const nextSessions = getSessions(db, { limit: 100 });
    setSpots(nextSpots);
    setSessions(nextSessions);
    if (!spotId && nextSpots[0]) {
      setSpotId(nextSpots[0].id);
    }
  }, [db, spotId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    if (!spotId) return;
    createSession(db, makeId('session'), {
      spotId,
      sessionDate: new Date().toISOString(),
      durationMin: Math.max(15, Number(durationMin) || 60),
      rating: Math.min(5, Math.max(1, Number(rating) || 3)),
      notes: notes.trim() || undefined,
    });
    setNotes('');
    loadData();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Card>
        <Text variant="subheading">Log Session</Text>
        <View style={styles.form}>
          <View style={styles.rowWrap}>
            {spots.map((spot) => (
              <Pressable
                key={spot.id}
                onPress={() => setSpotId(spot.id)}
                style={[
                  styles.chip,
                  spot.id === spotId && styles.chipActive,
                ]}
              >
                <Text variant="caption" color={spot.id === spotId ? colors.modules.surf : colors.textSecondary}>
                  {spot.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Duration (min)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            value={durationMin}
            onChangeText={setDurationMin}
          />
          <TextInput
            style={styles.input}
            placeholder="Rating (1-5)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            value={rating}
            onChangeText={setRating}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
          <Pressable style={styles.primaryButton} onPress={handleCreate}>
            <Text variant="label" color={colors.background}>Save Session</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.list}>
        {sessions.map((session) => (
          <Card key={session.id}>
            <View style={styles.itemHeader}>
              <View style={styles.itemCopy}>
                <Text variant="body">
                  {new Date(session.sessionDate).toLocaleDateString()} · {session.durationMin} min · {session.rating}/5
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {spots.find((spot) => spot.id === session.spotId)?.name ?? 'Unknown spot'}
                  {session.notes ? ` · ${session.notes}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => {
                deleteSession(db, session.id);
                loadData();
              }}>
                <Text variant="label" color={colors.danger}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))}
        {sessions.length === 0 && (
          <Card>
            <Text variant="caption" color={colors.textSecondary}>No sessions logged yet.</Text>
          </Card>
        )}
      </View>
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
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    borderColor: colors.modules.surf,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: colors.modules.surf,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
});
