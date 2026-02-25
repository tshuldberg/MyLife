import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { useGoal } from '../../hooks/books/use-goals';
import { useBooks } from '../../hooks/books/use-books';
import { useDatabase } from '../../components/DatabaseProvider';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({ label, value, onPress, danger }: SettingsRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row} disabled={!onPress}>
      <Text variant="body" color={danger ? colors.danger : colors.text}>
        {label}
      </Text>
      {value && (
        <Text variant="caption" color={colors.textSecondary}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color={colors.textTertiary}>{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

export default function BooksSettingsScreen() {
  const db = useDatabase();
  const currentYear = new Date().getFullYear();
  const { goal, save: saveGoal } = useGoal(currentYear);
  const { books } = useBooks();
  const bookCount = books.length;

  const handleSetGoal = useCallback(() => {
    Alert.prompt(
      'Set Reading Goal',
      `How many books do you want to read in ${currentYear}?`,
      (text) => {
        const num = parseInt(text, 10);
        if (num > 0) {
          saveGoal(num);
        }
      },
      'plain-text',
      String(goal?.target_books ?? 24),
      'number-pad',
    );
  }, [currentYear, goal, saveGoal]);

  const handleEraseAll = useCallback(() => {
    Alert.alert(
      'Erase All Book Data',
      'This will permanently delete all your books, sessions, reviews, and goals. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: () => {
            db.transaction(() => {
              db.execute('DELETE FROM bk_book_tags');
              db.execute('DELETE FROM bk_book_shelves');
              db.execute('DELETE FROM bk_reading_sessions');
              db.execute('DELETE FROM bk_reviews');
              db.execute('DELETE FROM bk_reading_goals');
              db.execute('DELETE FROM bk_tags');
              db.execute('DELETE FROM bk_import_log');
              db.execute('DELETE FROM bk_ol_cache');
              db.execute('DELETE FROM bk_books');
            });
            Alert.alert('Done', 'All book data has been erased.');
          },
        },
      ],
    );
  }, [db]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsSection title="Library">
        <SettingsRow label="Default shelf for new books" value="Want to Read" />
        <SettingsRow label="Cover image quality" value="Large" />
        <SettingsRow label="Default sort" value="Date Added" />
      </SettingsSection>

      <SettingsSection title="Goals">
        <SettingsRow
          label={`${currentYear} Reading Goal`}
          value={goal ? `${goal.target_books} books` : 'Not set'}
          onPress={handleSetGoal}
        />
        <SettingsRow label="Page goal" value="Not set" />
      </SettingsSection>

      <SettingsSection title="Import">
        <SettingsRow label="Import from Goodreads" onPress={() => {}} />
        <SettingsRow label="Import from StoryGraph" onPress={() => {}} />
      </SettingsSection>

      <SettingsSection title="Export">
        <SettingsRow label="Export library (CSV)" onPress={() => {}} />
        <SettingsRow label="Export library (JSON)" onPress={() => {}} />
        <SettingsRow label="Export library (Markdown)" onPress={() => {}} />
        <SettingsRow label="Export year-in-review image" onPress={() => {}} />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow label="Total books" value={String(bookCount)} />
        <SettingsRow label="Erase all book data" danger onPress={handleEraseAll} />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow label="Module" value="MyBooks" />
        <SettingsRow label="Privacy" value="No data collected. Ever." />
        <SettingsRow label="Book data" value="Powered by Open Library" />
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
