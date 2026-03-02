import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  getDocument,
  updateDocument,
  deleteDocument,
  type DocumentType,
} from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  lab_result: 'Lab Result',
  prescription: 'Prescription',
  insurance: 'Insurance',
  imaging: 'Imaging',
  vaccination: 'Vaccination',
  referral: 'Referral',
  discharge: 'Discharge',
  other: 'Other',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewerScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tick, setTick] = useState(0);

  const doc = useMemo(() => {
    if (!id) return null;
    try { return getDocument(db, id); } catch { return null; }
  }, [db, id, tick]);

  if (!doc) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="heading">Document not found</Text>
      </View>
    );
  }

  const isImage = doc.mime_type.startsWith('image/');
  const imageUri = isImage && doc.content
    ? `data:${doc.mime_type};base64,${Buffer.from(doc.content).toString('base64')}`
    : null;

  const handleToggleStar = () => {
    try {
      updateDocument(db, doc.id, { is_starred: !doc.is_starred });
      setTick((v) => v + 1);
    } catch {
      Alert.alert('Error', 'Failed to update document.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Document', `Delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            deleteDocument(db, doc.id);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete document.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text variant="heading" style={styles.title}>{doc.title}</Text>
      <View style={styles.metaRow}>
        <Text variant="caption" color={colors.textSecondary}>
          {DOC_TYPE_LABELS[doc.type as DocumentType] ?? doc.type}
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          {formatFileSize(doc.file_size)}
        </Text>
        {doc.document_date && (
          <Text variant="caption" color={colors.textSecondary}>
            {doc.document_date.slice(0, 10)}
          </Text>
        )}
      </View>

      {/* Content preview */}
      {imageUri ? (
        <Card style={styles.imageCard}>
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text variant="caption" color={colors.textSecondary}>
            {doc.mime_type.includes('pdf')
              ? 'PDF preview not available in this view. Export to view.'
              : `File type: ${doc.mime_type}`}
          </Text>
        </Card>
      )}

      {/* Notes */}
      {doc.notes && (
        <Card style={styles.card}>
          <Text variant="label" color={colors.textSecondary}>Notes</Text>
          <Text variant="body">{doc.notes}</Text>
        </Card>
      )}

      {/* Tags */}
      {doc.tags && (
        <Card style={styles.card}>
          <Text variant="label" color={colors.textSecondary}>Tags</Text>
          <View style={styles.tagRow}>
            {doc.tags.split(',').map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text variant="caption" color={ACCENT}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleToggleStar}>
          <Text variant="label" color={ACCENT}>
            {doc.is_starred ? 'Unstar' : 'Star'}
          </Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text variant="label" color={colors.danger}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  imageCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 300,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
});
