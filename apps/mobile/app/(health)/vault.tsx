import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  getDocuments,
  getStarredDocuments,
  getEmergencyInfo,
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

export default function VaultScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [tick] = useState(0);

  const documents = useMemo(() => {
    try { return getDocuments(db); } catch { return []; }
  }, [db, tick]);

  const starredDocs = useMemo(() => {
    try { return getStarredDocuments(db); } catch { return []; }
  }, [db, tick]);

  const emergencyInfo = useMemo(() => {
    try { return getEmergencyInfo(db); } catch { return null; }
  }, [db, tick]);

  const hasEmergencyInfo = emergencyInfo && (
    emergencyInfo.full_name ||
    emergencyInfo.blood_type ||
    emergencyInfo.allergies ||
    emergencyInfo.emergency_contacts
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Starred Documents */}
      {starredDocs.length > 0 && (
        <>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
            Starred
          </Text>
          {starredDocs.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push(`/(health)/document-viewer?id=${doc.id}` as never)}
            >
              <Card style={styles.card}>
                <Text variant="body">{doc.title}</Text>
                <View style={styles.docMeta}>
                  <Text variant="caption" color={colors.textSecondary}>
                    {DOC_TYPE_LABELS[doc.type as DocumentType] ?? doc.type}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {formatFileSize(doc.file_size)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {/* All Documents */}
      <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        Documents
      </Text>
      {documents.length > 0 ? (
        <>
          {documents.slice(0, 10).map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push(`/(health)/document-viewer?id=${doc.id}` as never)}
            >
              <Card style={styles.card}>
                <View style={styles.docRow}>
                  <View style={styles.flex1}>
                    <Text variant="body">{doc.title}</Text>
                    <View style={styles.docMeta}>
                      <Text variant="caption" color={colors.textSecondary}>
                        {DOC_TYPE_LABELS[doc.type as DocumentType] ?? doc.type}
                      </Text>
                      {doc.document_date && (
                        <Text variant="caption" color={colors.textSecondary}>
                          {doc.document_date.slice(0, 10)}
                        </Text>
                      )}
                      <Text variant="caption" color={colors.textSecondary}>
                        {formatFileSize(doc.file_size)}
                      </Text>
                    </View>
                  </View>
                  {doc.is_starred === 1 && (
                    <Text style={styles.starIcon}>*</Text>
                  )}
                </View>
              </Card>
            </Pressable>
          ))}
          {documents.length > 10 && (
            <Text variant="caption" color={colors.textSecondary} style={styles.moreText}>
              +{documents.length - 10} more documents
            </Text>
          )}
        </>
      ) : (
        <Card style={styles.card}>
          <Text variant="caption" color={colors.textSecondary}>
            Store lab results, prescriptions, and health records
          </Text>
        </Card>
      )}
      <Pressable
        style={styles.addButton}
        onPress={() => router.push('/(health)/add-document' as never)}
      >
        <Text variant="label" color={ACCENT}>+ Add Document</Text>
      </Pressable>

      {/* Emergency Info */}
      <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        Emergency Info
      </Text>
      <Pressable onPress={() => router.push('/(health)/emergency-info' as never)}>
        <Card style={styles.card}>
          <Text variant="subheading">ICE Card</Text>
          {hasEmergencyInfo ? (
            <View style={styles.icePreview}>
              {emergencyInfo.blood_type && (
                <View style={styles.iceBadge}>
                  <Text variant="caption" color={ACCENT}>{emergencyInfo.blood_type}</Text>
                </View>
              )}
              {emergencyInfo.allergies && (
                <Text variant="caption" color={colors.textSecondary}>
                  Allergies: {emergencyInfo.allergies.slice(0, 50)}{emergencyInfo.allergies.length > 50 ? '...' : ''}
                </Text>
              )}
              {emergencyInfo.emergency_contacts && (
                <Text variant="caption" color={colors.textSecondary}>
                  Emergency contacts configured
                </Text>
              )}
            </View>
          ) : (
            <Text variant="caption" color={colors.textSecondary}>
              Tap to add emergency contacts, allergies, blood type, conditions
            </Text>
          )}
        </Card>
      </Pressable>

      {/* Settings */}
      <Text variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        Settings
      </Text>
      <Pressable onPress={() => router.push('/(health)/health-sync-settings' as never)}>
        <Card style={styles.card}>
          <Text variant="subheading">Health Sync</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Configure wearable data import
          </Text>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/(health)/export' as never)}>
        <Card style={styles.card}>
          <Text variant="subheading">Export Data</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Doctor report, therapy report, CSV/JSON export
          </Text>
        </Card>
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
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starIcon: {
    fontSize: 18,
    color: ACCENT,
  },
  moreText: {
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  addButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  icePreview: {
    gap: spacing.xs,
  },
  iceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ACCENT,
  },
});
