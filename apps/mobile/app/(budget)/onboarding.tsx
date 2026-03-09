import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, Card, colors, spacing } from '@mylife/ui';
import { createAccount, createEnvelope, createCategoryGroup, setEnvelopeGroup } from '@mylife/budget';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

const BUDGET_ACCENT = colors.modules.budget;

type Step = 'welcome' | 'add-account' | 'add-categories' | 'done';

const STEPS: Step[] = ['welcome', 'add-account', 'add-categories', 'done'];

const SUGGESTED_CATEGORIES = [
  { emoji: '\u{1F3E0}', name: 'Rent / Mortgage' },
  { emoji: '\u{1F6D2}', name: 'Groceries' },
  { emoji: '\u{26A1}', name: 'Utilities' },
  { emoji: '\u{1F697}', name: 'Transportation' },
  { emoji: '\u{1F355}', name: 'Dining Out' },
  { emoji: '\u{1F3AE}', name: 'Entertainment' },
  { emoji: '\u{1F455}', name: 'Shopping' },
  { emoji: '\u{1F3E5}', name: 'Healthcare' },
  { emoji: '\u{1F6DF}', name: 'Emergency Fund' },
  { emoji: '\u{2708}\u{FE0F}', name: 'Vacation' },
];

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text variant="body">{text}</Text>
    </View>
  );
}

export default function BudgetOnboardingScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [accountName] = useState('Checking');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['Rent / Mortgage', 'Groceries', 'Utilities', 'Dining Out', 'Emergency Fund']),
  );

  const stepIndex = STEPS.indexOf(step);

  const toggleCategory = useCallback((name: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const handleFinish = useCallback(() => {
    createAccount(db, uuid(), {
      name: accountName,
      type: 'checking',
      current_balance: 0,
    });

    const group = createCategoryGroup(db, uuid(), { name: 'My Budget' });

    const selected = SUGGESTED_CATEGORIES.filter((c) => selectedCategories.has(c.name));
    for (const cat of selected) {
      const envId = uuid();
      createEnvelope(db, envId, {
        name: cat.name,
        icon: cat.emoji,
        monthly_budget: 0,
      });
      setEnvelopeGroup(db, envId, group.id);
    }

    router.replace('/(budget)/' as never);
  }, [db, router, accountName, selectedCategories]);

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.dot, i <= stepIndex && styles.dotActive]}
          />
        ))}
      </View>

      {step === 'welcome' && (
        <View style={styles.page}>
          <Text variant="heading" style={styles.title}>
            Welcome to MyBudget
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Privacy-first envelope budgeting with subscription tracking.
            All your data stays on your device.
          </Text>
          <View style={styles.features}>
            <FeatureItem icon={'\u{1F4B0}'} text="Envelope budgeting that works" />
            <FeatureItem icon={'\u{1F504}'} text="Track every subscription" />
            <FeatureItem icon={'\u{1F4CA}'} text="See where your money goes" />
            <FeatureItem icon={'\u{1F512}'} text="100% local, 100% private" />
          </View>
          <Button
            label="Get Started"
            onPress={() => setStep('add-account')}
            style={styles.nextBtn}
          />
        </View>
      )}

      {step === 'add-account' && (
        <View style={styles.page}>
          <Text variant="heading" style={styles.title}>
            Add Your First Account
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Start with your primary checking account. You can add more later.
          </Text>
          <Card style={styles.inputCard}>
            <Text variant="caption" style={styles.inputLabel}>Account Name</Text>
            <Text variant="body">{accountName}</Text>
          </Card>
          <View style={styles.buttonRow}>
            <Button
              variant="secondary"
              label="Back"
              onPress={() => setStep('welcome')}
            />
            <Button
              label="Next"
              onPress={() => setStep('add-categories')}
              style={styles.nextBtnFlex}
            />
          </View>
        </View>
      )}

      {step === 'add-categories' && (
        <View style={styles.page}>
          <Text variant="heading" style={styles.title}>
            Choose Categories
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Select the budget categories you want to track. Tap to toggle.
          </Text>
          <View style={styles.categoryGrid}>
            {SUGGESTED_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.has(cat.name);
              return (
                <Pressable
                  key={cat.name}
                  onPress={() => toggleCategory(cat.name)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    variant="caption"
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.buttonRow}>
            <Button
              variant="secondary"
              label="Back"
              onPress={() => setStep('add-account')}
            />
            <Button
              label="Next"
              onPress={() => setStep('done')}
              style={styles.nextBtnFlex}
            />
          </View>
        </View>
      )}

      {step === 'done' && (
        <View style={styles.page}>
          <Text variant="heading" style={styles.doneTitle}>
            You're All Set!
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Your budget is ready. Start by assigning money to your categories.
          </Text>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text variant="caption" color={colors.textSecondary}>Account</Text>
              <Text variant="body">{accountName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="caption" color={colors.textSecondary}>Categories</Text>
              <Text variant="body">{selectedCategories.size}</Text>
            </View>
          </Card>
          <Button
            label="Start Budgeting"
            onPress={handleFinish}
            style={styles.nextBtn}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: 40,
    paddingBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: BUDGET_ACCENT,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  doneTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  features: {
    gap: spacing.md,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  inputCard: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  inputLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 'auto',
    paddingBottom: 60,
  },
  nextBtn: {
    marginTop: 'auto',
    marginBottom: 60,
  },
  nextBtnFlex: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: BUDGET_ACCENT,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: BUDGET_ACCENT,
  },
  summaryCard: {
    gap: spacing.md,
    marginBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
