import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getFlashDashboard, listDecks, listDueFlashcards, rateFlashcard } from '@mylife/flash';
import type { CardRating } from '@mylife/flash';
import { Card, Text, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const FLASH_ACCENT = '#FBBF24';
const RATINGS: CardRating[] = ['again', 'hard', 'good', 'easy'];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

export default function FlashStudyScreen() {
  const db = useDatabase();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((value) => value + 1);
  const decks = useMemo(() => listDecks(db), [db, tick]);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;
  const dueCards = useMemo(
    () => listDueFlashcards(db, selectedDeck?.id, new Date().toISOString(), 20),
    [db, selectedDeck?.id, tick],
  );
  const dashboard = useMemo(() => getFlashDashboard(db), [db, tick]);
  const currentCard = dueCards[0] ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text variant="subheading">Study Queue</Text>
        <View style={styles.statsGrid}>
          <Stat label="Due Reviews" value={String(dashboard.dueCount)} />
          <Stat label="New Cards" value={String(dashboard.newCount)} />
          <Stat label="Streak" value={String(dashboard.currentStreak)} />
        </View>
        <Text variant="caption" color={colors.textSecondary}>
          Current hub scope uses a lightweight local scheduler with review logs and daily streaks.
          Full FSRS tuning, cram modes, undo review, and sibling bury rules are still pending.
        </Text>
      </Card>

      <Card>
        <Text variant="subheading">Deck Filter</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => {
              setSelectedDeckId(null);
              setRevealed(false);
            }}
            style={[styles.chip, !selectedDeck ? styles.chipActive : null]}
          >
            <Text variant="caption" color={!selectedDeck ? colors.background : colors.textSecondary}>
              All decks
            </Text>
          </Pressable>
          {decks.map((deck) => {
            const selected = deck.id === selectedDeck?.id;
            return (
              <Pressable
                key={deck.id}
                onPress={() => {
                  setSelectedDeckId(deck.id);
                  setRevealed(false);
                }}
                style={[styles.chip, selected ? styles.chipActive : null]}
              >
                <Text variant="caption" color={selected ? colors.background : colors.textSecondary}>
                  {deck.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text variant="subheading">
          {selectedDeck ? `${selectedDeck.name} study` : 'Next card'}
        </Text>
        {!currentCard ? (
          <Text variant="caption" color={colors.textSecondary}>
            All caught up for now. Add more cards in Decks or come back when reviews are due.
          </Text>
        ) : (
          <View style={styles.studyArea}>
            <Pressable style={styles.flashcard} onPress={() => setRevealed((value) => !value)}>
              <Text variant="caption" color={colors.textSecondary}>
                {revealed ? 'Answer' : 'Prompt'}
              </Text>
              <Text style={styles.cardText}>{revealed ? currentCard.back || 'No answer yet' : currentCard.front}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Tap card to {revealed ? 'see prompt again' : 'reveal answer'}
              </Text>
            </Pressable>

            <View style={styles.ratingRow}>
              {RATINGS.map((rating) => (
                <Pressable
                  key={rating}
                  disabled={!revealed}
                  style={[styles.ratingButton, !revealed ? styles.ratingButtonDisabled : null]}
                  onPress={() => {
                    rateFlashcard(db, currentCard.id, rating, new Date().toISOString());
                    setRevealed(false);
                    refresh();
                  }}
                >
                  <Text variant="label" color={revealed ? colors.background : colors.textSecondary}>
                    {rating}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>
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
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    minWidth: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    gap: 4,
  },
  statValue: {
    color: FLASH_ACCENT,
    fontSize: 22,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: {
    backgroundColor: FLASH_ACCENT,
    borderColor: FLASH_ACCENT,
  },
  studyArea: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  flashcard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    minHeight: 220,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardText: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingButton: {
    flexGrow: 1,
    minWidth: 120,
    borderRadius: 12,
    backgroundColor: FLASH_ACCENT,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  ratingButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
