import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text, Card, colors, spacing } from '@mylife/ui';
import {
  getEmergencyInfo,
  updateEmergencyInfo,
  type BloodType,
} from '@mylife/health';
import { useDatabase } from '../../components/DatabaseProvider';

const ACCENT = colors.modules.health;
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EmergencyInfoScreen() {
  const db = useDatabase();
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((v) => v + 1), []);

  const info = useMemo(() => {
    try { return getEmergencyInfo(db); } catch { return null; }
  }, [db, tick]);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [contacts, setContacts] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [physician, setPhysician] = useState('');
  const [physicianPhone, setPhysicianPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Load existing data into form on first render
  if (info && !loaded) {
    setFullName(info.full_name ?? '');
    setDob(info.date_of_birth ?? '');
    setBloodType(info.blood_type ?? null);
    setAllergies(info.allergies ?? '');
    setConditions(info.conditions ?? '');
    setContacts(info.emergency_contacts ?? '');
    setInsuranceProvider(info.insurance_provider ?? '');
    setPolicyNumber(info.insurance_policy_number ?? '');
    setPhysician(info.primary_physician ?? '');
    setPhysicianPhone(info.physician_phone ?? '');
    setNotes(info.notes ?? '');
    setLoaded(true);
  }

  const handleSave = () => {
    try {
      updateEmergencyInfo(db, {
        full_name: fullName || undefined,
        date_of_birth: dob || undefined,
        blood_type: bloodType ?? undefined,
        allergies: allergies || undefined,
        conditions: conditions || undefined,
        emergency_contacts: contacts || undefined,
        insurance_provider: insuranceProvider || undefined,
        insurance_policy_number: policyNumber || undefined,
        primary_physician: physician || undefined,
        physician_phone: physicianPhone || undefined,
        notes: notes || undefined,
      });
      refresh();
      Alert.alert('Saved', 'Emergency info updated.');
    } catch {
      Alert.alert('Error', 'Failed to save emergency info.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading" style={styles.title}>ICE Card</Text>
      <Text variant="caption" color={colors.textSecondary} style={styles.subtitle}>
        In Case of Emergency. This information is stored locally on your device.
      </Text>

      {/* Personal */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Personal</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colors.textTertiary}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          placeholderTextColor={colors.textTertiary}
          value={dob}
          onChangeText={setDob}
        />
      </Card>

      {/* Blood Type */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Blood Type</Text>
        <View style={styles.chipRow}>
          {BLOOD_TYPES.map((bt) => (
            <Pressable
              key={bt}
              style={[styles.chip, bloodType === bt && styles.chipActive]}
              onPress={() => setBloodType(bloodType === bt ? null : bt)}
            >
              <Text
                variant="caption"
                color={bloodType === bt ? colors.background : colors.text}
              >
                {bt}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Medical */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Medical</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Allergies (one per line)"
          placeholderTextColor={colors.textTertiary}
          value={allergies}
          onChangeText={setAllergies}
          multiline
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Conditions (one per line)"
          placeholderTextColor={colors.textTertiary}
          value={conditions}
          onChangeText={setConditions}
          multiline
        />
      </Card>

      {/* Emergency Contacts */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Emergency Contacts</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Name: Phone (one per line)"
          placeholderTextColor={colors.textTertiary}
          value={contacts}
          onChangeText={setContacts}
          multiline
        />
      </Card>

      {/* Insurance */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Insurance</Text>
        <TextInput
          style={styles.input}
          placeholder="Insurance Provider"
          placeholderTextColor={colors.textTertiary}
          value={insuranceProvider}
          onChangeText={setInsuranceProvider}
        />
        <TextInput
          style={styles.input}
          placeholder="Policy Number"
          placeholderTextColor={colors.textTertiary}
          value={policyNumber}
          onChangeText={setPolicyNumber}
        />
      </Card>

      {/* Physician */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Primary Physician</Text>
        <TextInput
          style={styles.input}
          placeholder="Physician Name"
          placeholderTextColor={colors.textTertiary}
          value={physician}
          onChangeText={setPhysician}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          placeholderTextColor={colors.textTertiary}
          value={physicianPhone}
          onChangeText={setPhysicianPhone}
          keyboardType="phone-pad"
        />
      </Card>

      {/* Notes */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.textSecondary}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Additional notes..."
          placeholderTextColor={colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Card>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text variant="label" color={colors.background}>Save</Text>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
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
