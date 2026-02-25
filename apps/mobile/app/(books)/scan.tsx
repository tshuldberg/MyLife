import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { Text, Button, BookCover, Card, colors, spacing } from '@mylife/ui';
import { requestCameraPermission, ISBN_BARCODE_TYPES, isValidISBN } from '../../lib/scanner';
import { useDatabase } from '../../components/DatabaseProvider';
import { useBooks } from '../../hooks/books/use-books';
import { useShelves } from '../../hooks/books/use-shelves';
import {
  getBookByISBN,
  olEditionToBook,
  getBookByISBNLocal,
  addBookToShelf,
} from '@mylife/books';

const BOOKS_ACCENT = colors.modules.books;

type ScanState =
  | { type: 'scanning' }
  | { type: 'loading'; isbn: string }
  | { type: 'found'; isbn: string; title: string; authors: string; coverUrl: string | null; bookInsert: ReturnType<typeof olEditionToBook> }
  | { type: 'not_found'; isbn: string }
  | { type: 'already_exists'; isbn: string; title: string }
  | { type: 'error'; isbn: string; message: string }
  | { type: 'manual' };

export default function ScanScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { create } = useBooks();
  const { shelves } = useShelves();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ type: 'scanning' });
  const [manualISBN, setManualISBN] = useState('');
  const scanLockRef = useRef(false);

  useEffect(() => {
    requestCameraPermission().then(setHasPermission);
  }, []);

  const lookupISBN = useCallback(
    async (isbn: string) => {
      const existing = getBookByISBNLocal(db, isbn);
      if (existing) {
        setScanState({ type: 'already_exists', isbn, title: existing.title });
        return;
      }

      setScanState({ type: 'loading', isbn });

      try {
        const edition = await getBookByISBN(isbn);
        const bookInsert = olEditionToBook(edition);
        const authors = (edition.authors ?? []).map((a) => a.key).join(', ');

        let coverUrl: string | null = null;
        if (edition.isbn_13?.[0]) {
          coverUrl = `https://covers.openlibrary.org/b/isbn/${edition.isbn_13[0]}-L.jpg`;
        } else if (edition.isbn_10?.[0]) {
          coverUrl = `https://covers.openlibrary.org/b/isbn/${edition.isbn_10[0]}-L.jpg`;
        }

        setScanState({
          type: 'found',
          isbn,
          title: edition.title,
          authors: bookInsert.authors,
          coverUrl,
          bookInsert,
        });
      } catch {
        setScanState({ type: 'not_found', isbn });
      }
    },
    [db],
  );

  const handleBarcodeScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanLockRef.current) return;
      const code = result.data;
      if (!isValidISBN(code)) return;

      scanLockRef.current = true;
      lookupISBN(code);
    },
    [lookupISBN],
  );

  const handleManualLookup = useCallback(() => {
    const isbn = manualISBN.trim().replace(/[-\s]/g, '');
    if (!isValidISBN(isbn)) {
      Alert.alert('Invalid ISBN', 'Please enter a valid 10 or 13 digit ISBN.');
      return;
    }
    lookupISBN(isbn);
  }, [manualISBN, lookupISBN]);

  const handleAddBook = useCallback(
    (bookInsert: ReturnType<typeof olEditionToBook>) => {
      const book = create(bookInsert);
      const tbrShelf = shelves.find((s) => s.slug === 'want-to-read');
      if (tbrShelf) {
        addBookToShelf(db, book.id, tbrShelf.id);
      }
      Alert.alert('Added!', `"${book.title}" added to Want to Read.`, [
        { text: 'Scan Another', onPress: resetScan },
        { text: 'View Book', onPress: () => router.replace(`/(books)/book/${book.id}`) },
      ]);
    },
    [create, shelves, db, router],
  );

  const resetScan = useCallback(() => {
    scanLockRef.current = false;
    setScanState({ type: 'scanning' });
    setManualISBN('');
  }, []);

  if (hasPermission === false) {
    return (
      <>
        <Stack.Screen options={{ title: 'Scan Barcode' }} />
        <View style={styles.centered}>
          <Text variant="body" color={colors.textSecondary} style={styles.centeredText}>
            Camera permission is required to scan barcodes.
          </Text>
          <Button variant="primary" label="Grant Permission" onPress={() => requestCameraPermission().then(setHasPermission)} />
          <Button variant="secondary" label="Enter ISBN Manually" onPress={() => setScanState({ type: 'manual' })} />
        </View>
      </>
    );
  }

  if (hasPermission === null) {
    return (
      <>
        <Stack.Screen options={{ title: 'Scan Barcode' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BOOKS_ACCENT} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Scan Barcode' }} />
      <View style={styles.container}>
        {scanState.type === 'manual' ? (
          <View style={styles.manualSection}>
            <Text variant="subheading" color={colors.text}>Enter ISBN</Text>
            <TextInput
              value={manualISBN}
              onChangeText={setManualISBN}
              placeholder="978-0-123456-78-9"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={styles.isbnInput}
              autoFocus
            />
            <Button variant="primary" label="Look Up" onPress={handleManualLookup} disabled={manualISBN.trim().length < 10} />
            <Button variant="ghost" label="Back to Scanner" onPress={resetScan} />
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: [...ISBN_BARCODE_TYPES],
              }}
              onBarcodeScanned={scanState.type === 'scanning' ? handleBarcodeScan : undefined}
            />
            <View style={styles.overlay}>
              <View style={styles.guide}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              {scanState.type === 'scanning' && (
                <Text variant="caption" color={colors.text} style={styles.guideText}>
                  Point at a book's barcode
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {scanState.type === 'scanning' && (
            <Button variant="secondary" label="Enter ISBN Manually" onPress={() => setScanState({ type: 'manual' })} />
          )}

          {scanState.type === 'loading' && (
            <View style={styles.footerContent}>
              <ActivityIndicator size="small" color={BOOKS_ACCENT} />
              <Text variant="body" color={colors.textSecondary}>
                Looking up ISBN {scanState.isbn}...
              </Text>
            </View>
          )}

          {scanState.type === 'found' && (
            <Card style={styles.resultCard}>
              <View style={styles.resultRow}>
                <BookCover coverUrl={scanState.coverUrl} size="small" title={scanState.title} />
                <View style={styles.resultInfo}>
                  <Text variant="bookTitle" numberOfLines={2} style={{ fontSize: 16 }}>
                    {scanState.title}
                  </Text>
                  <Text variant="bookAuthor" numberOfLines={1}>
                    {parseAuthors(scanState.authors)}
                  </Text>
                </View>
              </View>
              <Button variant="primary" label="Add to Want to Read" onPress={() => handleAddBook(scanState.bookInsert)} />
              <Button variant="ghost" label="Scan Another" onPress={resetScan} />
            </Card>
          )}

          {scanState.type === 'not_found' && (
            <View style={styles.footerContent}>
              <Text variant="body" color={colors.textSecondary}>
                No book found for ISBN {scanState.isbn}.
              </Text>
              <Button variant="secondary" label="Try Again" onPress={resetScan} />
              <Button variant="ghost" label="Add Manually" onPress={() => router.replace('/(books)/book/add')} />
            </View>
          )}

          {scanState.type === 'already_exists' && (
            <View style={styles.footerContent}>
              <Text variant="body" color={colors.textSecondary}>
                "{scanState.title}" is already in your library.
              </Text>
              <Button variant="secondary" label="Scan Another" onPress={resetScan} />
            </View>
          )}

          {scanState.type === 'error' && (
            <View style={styles.footerContent}>
              <Text variant="body" color={colors.danger}>
                {scanState.message}
              </Text>
              <Button variant="secondary" label="Try Again" onPress={resetScan} />
            </View>
          )}
        </View>
      </View>
    </>
  );
}

function parseAuthors(authors: string): string {
  try {
    const arr = JSON.parse(authors) as string[];
    return arr.length > 0 ? arr.join(', ') : 'Unknown Author';
  } catch {
    return authors || 'Unknown Author';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  centeredText: {
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    width: 260,
    height: 160,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: BOOKS_ACCENT,
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3,
  },
  guideText: {
    marginTop: spacing.md,
  },
  manualSection: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
    alignItems: 'center',
  },
  isbnInput: {
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: BOOKS_ACCENT,
    paddingVertical: spacing.sm,
    width: '80%',
    letterSpacing: 1,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.background,
    minHeight: 100,
  },
  footerContent: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  resultCard: {
    width: '100%',
    gap: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
});
