import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Button, Card, Text, colors, spacing } from '@mylife/ui';
import { parseReaderUpload } from '@mylife/books';
import { useReaderDocuments } from '../../../hooks/books/use-reader-documents';

const BOOKS_ACCENT = colors.modules.books;

const PICKER_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'application/rtf',
  'application/epub+zip',
  'application/pdf',
  'application/x-mobipocket-ebook',
  'application/vnd.amazon.ebook',
];

const BINARY_EXTENSIONS = ['.epub', '.pdf', '.mobi', '.azw', '.azw3'];

export default function ReaderLibraryScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const { documents, loading, create } = useReaderDocuments();

  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      const lowerName = file.name.toLowerCase();
      const mime = file.mimeType ?? null;
      const isBinary = BINARY_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
        || mime === 'application/epub+zip'
        || mime === 'application/pdf'
        || mime === 'application/x-mobipocket-ebook'
        || mime === 'application/vnd.amazon.ebook';

      setUploading(true);

      const parsed = isBinary
        ? await parseReaderUpload({
          fileName: file.name,
          mimeType: mime,
          base64Content: await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          }),
        })
        : await parseReaderUpload({
          fileName: file.name,
          mimeType: mime,
          textContent: await FileSystem.readAsStringAsync(file.uri),
        });

      const created = create({
        title: parsed.title,
        author: parsed.author,
        source_type: 'upload',
        mime_type: parsed.mimeType,
        file_name: parsed.fileName,
        file_extension: parsed.fileExtension,
        text_content: parsed.textContent,
        total_chars: parsed.totalChars,
        total_words: parsed.totalWords,
      });

      Alert.alert(
        'Document Ready',
        `"${created.title}" was added to your reader.`,
        [
          {
            text: 'Open',
            onPress: () => router.push(`/(books)/reader/${created.id}`),
          },
          { text: 'Later', style: 'cancel' },
        ],
      );
    } catch (err) {
      Alert.alert(
        'Upload failed',
        err instanceof Error ? err.message : 'Could not import this file.',
      );
    } finally {
      setUploading(false);
    }
  }, [create, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BOOKS_ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.heroCard}>
        <Text variant="subheading">Your Personal E-Reader</Text>
        <Text variant="body" color={colors.textSecondary}>
          Upload TXT, Markdown, HTML, JSON, RTF, EPUB, PDF, MOBI, or AZW files and read them inside MyBooks.
        </Text>
        <Button
          variant="primary"
          label={uploading ? 'Importing…' : 'Upload Document'}
          onPress={() => {
            if (!uploading) {
              void handleUpload();
            }
          }}
        />
      </Card>

      {documents.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={colors.textTertiary}>
            No reader documents yet. Upload your first book or note file.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {documents.map((document) => (
            <Pressable
              key={document.id}
              style={styles.docRow}
              onPress={() => router.push(`/(books)/reader/${document.id}`)}
            >
              <View style={styles.docMeta}>
                <Text variant="bookTitle" numberOfLines={1} style={styles.docTitle}>
                  {document.title}
                </Text>
                <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {(document.author ?? 'Unknown Author')} · {document.total_words.toLocaleString()} words
                </Text>
                <Text variant="caption" color={colors.textTertiary}>
                  {document.file_extension?.toUpperCase() ?? 'DOC'} · {Math.round(document.progress_percent)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(0, Math.min(100, document.progress_percent))}%` },
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    gap: spacing.sm,
  },
  empty: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  docRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  docMeta: {
    gap: 4,
  },
  docTitle: {
    fontSize: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BOOKS_ACCENT,
  },
});
