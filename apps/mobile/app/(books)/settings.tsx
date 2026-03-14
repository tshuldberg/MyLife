import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { useGoal } from '../../hooks/books/use-goals';
import { useBooks } from '../../hooks/books/use-books';
import { useShelves } from '../../hooks/books/use-shelves';
import { useDatabase } from '../../components/DatabaseProvider';
import {
  getBooksSettings,
  resolvePreferredShelf,
  setBooksCoverImageQuality,
  setBooksDefaultShelf,
  setBooksDefaultSort,
  type CoverImageQuality,
  type LibrarySortPreference,
} from '../../lib/books/settings';
import { buildLibraryExportPayload, runLibraryImport, type ImportSource } from '../../lib/books/portability';

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

const COVER_QUALITY_LABELS: Record<CoverImageQuality, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

const SORT_LABELS: Record<LibrarySortPreference, string> = {
  added: 'Date Added',
  title: 'Title',
  author: 'Author',
  rating: 'Rating',
};

const COVER_QUALITY_OPTIONS: Array<{ label: string; value: CoverImageQuality }> = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

const SORT_OPTIONS: Array<{ label: string; value: LibrarySortPreference }> = [
  { label: 'Date Added', value: 'added' },
  { label: 'Title', value: 'title' },
  { label: 'Author', value: 'author' },
  { label: 'Rating', value: 'rating' },
];

async function shareTextFile(filename: string, content: string, mimeType: string): Promise<void> {
  const targetDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!targetDir) {
    throw new Error('No writable filesystem directory available.');
  }

  const uri = `${targetDir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Share.share({
    title: filename,
    url: uri,
    message: content,
  });
}

export default function BooksSettingsScreen() {
  const router = useRouter();
  const db = useDatabase();
  const currentYear = new Date().getFullYear();
  const { goal, save: saveGoal, refresh: refreshGoal } = useGoal(currentYear);
  const { books, refresh: refreshBooks } = useBooks();
  const { shelves } = useShelves();
  const [preferences, setPreferences] = useState(() => getBooksSettings(db));
  const bookCount = books.length;

  const refreshPreferences = useCallback(() => {
    setPreferences(getBooksSettings(db));
  }, [db]);

  useEffect(() => {
    refreshPreferences();
  }, [refreshPreferences]);

  const preferredShelf = useMemo(
    () => resolvePreferredShelf(shelves, preferences.defaultShelfSlug),
    [preferences.defaultShelfSlug, shelves],
  );

  const handleSetGoal = useCallback(() => {
    Alert.prompt(
      'Set Reading Goal',
      `How many books do you want to read in ${currentYear}?`,
      (text) => {
        const num = parseInt(text, 10);
        if (num > 0) {
          saveGoal(num, goal?.target_pages ?? null);
        }
      },
      'plain-text',
      String(goal?.target_books ?? 24),
      'number-pad',
    );
  }, [currentYear, goal, saveGoal]);

  const handleSetPageGoal = useCallback(() => {
    Alert.prompt(
      'Set Page Goal',
      `How many pages do you want to read in ${currentYear}? Leave blank to clear.`,
      (text) => {
        const trimmed = text.trim();
        if (trimmed.length === 0) {
          saveGoal(goal?.target_books ?? 24, null);
          return;
        }

        const pageGoal = parseInt(trimmed, 10);
        if (pageGoal > 0) {
          saveGoal(goal?.target_books ?? 24, pageGoal);
        }
      },
      'plain-text',
      goal?.target_pages ? String(goal.target_pages) : '',
      'number-pad',
    );
  }, [currentYear, goal, saveGoal]);

  const handleSetDefaultShelf = useCallback(() => {
    if (shelves.length === 0) {
      Alert.alert('No shelves available', 'Create a shelf first, then set it as default.');
      return;
    }

    const options = [
      ...shelves.map((shelf) => ({
        text: shelf.name,
        onPress: () => {
          setBooksDefaultShelf(db, shelf.slug);
          refreshPreferences();
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Default shelf for new books', 'Choose where newly added books should go.', options);
  }, [db, refreshPreferences, shelves]);

  const handleSetCoverQuality = useCallback(() => {
    const options = [
      ...COVER_QUALITY_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => {
          setBooksCoverImageQuality(db, option.value);
          refreshPreferences();
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Cover image quality', 'Choose your preferred cover image size.', options);
  }, [db, refreshPreferences]);

  const handleSetDefaultSort = useCallback(() => {
    const options = [
      ...SORT_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => {
          setBooksDefaultSort(db, option.value);
          refreshPreferences();
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Default sort', 'Choose the default library sort order.', options);
  }, [db, refreshPreferences]);

  const handleImport = useCallback(
    async (source: ImportSource) => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) {
          return;
        }

        const file = result.assets[0];
        const csv = await FileSystem.readAsStringAsync(file.uri);
        const outcome = runLibraryImport(db, source, file.name, csv);

        refreshBooks();
        refreshGoal();

        Alert.alert(
          'Import complete',
          `${outcome.booksImported} books imported.\n${outcome.booksSkipped} skipped.\n${outcome.errorCount} errors.`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert('Import failed', message);
      }
    },
    [db, refreshBooks, refreshGoal],
  );

  const handleExport = useCallback(
    async (format: 'csv' | 'json' | 'markdown') => {
      try {
        const payload = buildLibraryExportPayload(db);
        const timestamp = new Date().toISOString().slice(0, 10);

        if (format === 'csv') {
          await shareTextFile(`mybooks-library-${timestamp}.csv`, payload.csv, 'text/csv');
          return;
        }
        if (format === 'json') {
          await shareTextFile(`mybooks-library-${timestamp}.json`, payload.json, 'application/json');
          return;
        }

        await shareTextFile(`mybooks-library-${timestamp}.md`, payload.markdown, 'text/markdown');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert('Export failed', message);
      }
    },
    [db],
  );

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
            refreshBooks();
            refreshGoal();
            Alert.alert('Done', 'All book data has been erased.');
          },
        },
      ],
    );
  }, [db, refreshBooks, refreshGoal]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsSection title="Library">
        <SettingsRow
          label="Default shelf for new books"
          value={preferredShelf?.name ?? 'Want to Read'}
          onPress={handleSetDefaultShelf}
        />
        <SettingsRow
          label="Cover image quality"
          value={COVER_QUALITY_LABELS[preferences.coverImageQuality]}
          onPress={handleSetCoverQuality}
        />
        <SettingsRow
          label="Default sort"
          value={SORT_LABELS[preferences.defaultSort]}
          onPress={handleSetDefaultSort}
        />
      </SettingsSection>

      <SettingsSection title="Goals">
        <SettingsRow
          label={`${currentYear} Reading Goal`}
          value={goal ? `${goal.target_books} books` : 'Not set'}
          onPress={handleSetGoal}
        />
        <SettingsRow
          label="Page goal"
          value={goal?.target_pages ? `${goal.target_pages} pages` : 'Not set'}
          onPress={handleSetPageGoal}
        />
      </SettingsSection>

      <SettingsSection title="Import">
        <SettingsRow label="Import from Goodreads" onPress={() => void handleImport('goodreads')} />
        <SettingsRow label="Import from StoryGraph" onPress={() => void handleImport('storygraph')} />
      </SettingsSection>

      <SettingsSection title="Export">
        <SettingsRow label="Export library (CSV)" onPress={() => void handleExport('csv')} />
        <SettingsRow label="Export library (JSON)" onPress={() => void handleExport('json')} />
        <SettingsRow label="Export library (Markdown)" onPress={() => void handleExport('markdown')} />
        <SettingsRow
          label="Export year-in-review image"
          onPress={() => router.push('/(books)/year-review')}
        />
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
