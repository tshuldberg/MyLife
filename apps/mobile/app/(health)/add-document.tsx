import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { createDocument, type DocumentType } from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

const DOC_TYPES: { id: DocumentType; label: string }[] = [
  { id: 'lab_result', label: 'Lab Result' },
  { id: 'prescription', label: 'Prescription' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'imaging', label: 'Imaging' },
  { id: 'vaccination', label: 'Vaccination' },
  { id: 'referral', label: 'Referral' },
  { id: 'discharge', label: 'Discharge' },
  { id: 'other', label: 'Other' },
];

export default function AddDocumentScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('lab_result');
  const [notes, setNotes] = useState('');
  const [docDate, setDocDate] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a document title.');
      return;
    }

    // Placeholder: in a real implementation this would use expo-image-picker
    // or expo-document-picker to capture the file content.
    // For now, create a minimal document entry.
    try {
      const placeholder = new Uint8Array([0x50, 0x4c, 0x41, 0x43, 0x45, 0x48, 0x4f, 0x4c, 0x44, 0x45, 0x52]);
      createDocument(db, {
        title: title.trim(),
        type: docType,
        mime_type: 'application/octet-stream',
        content: placeholder,
        notes: notes.trim() || undefined,
        document_date: docDate.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save document.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>Add Document</Text>
      <Text variant="caption" color={colors.textSecondary} style={styles.subtitle}>
        Store lab results, prescriptions, and health records.
      </Text>

      {/* Title */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Blood Work Results - Jan 2026"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
      </Card>

      {/* Type */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Type</Text>
        <View style={styles.chipRow}>
          {DOC_TYPES.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.chip, docType === t.id && styles.chipActive]}
              onPress={() => setDocType(t.id)}
            >
              <Text
                variant="caption"
                color={docType === t.id ? colors.background : colors.text}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Date */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Document Date (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textTertiary}
          value={docDate}
          onChangeText={setDocDate}
        />
      </Card>

      {/* Notes */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Additional notes..."
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Card>

      {/* File capture placeholder */}
      <Card style={styles.card}>
        <Text variant="caption" color={colors.textSecondary}>
          Camera capture and file picker will be available in a future update.
          Documents created now will be saved as metadata entries.
        </Text>
      </Card>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text variant="label" color={colors.background}>Save Document</Text>
      </Pressable>
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
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
