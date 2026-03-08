import { useState, useCallback } from 'react';
import { ScrollView, View, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, Card, colors, spacing } from '@mylife/ui';
import { createTransaction, getAccounts, type Account } from '@mylife/budget';
import { useDatabase } from '../../components/DatabaseProvider';
import { uuid } from '../../lib/uuid';

type WizardStep = 'select-file' | 'preview' | 'confirm';

interface ParsedRow {
  date: string;
  payee: string;
  memo: string | null;
  amount: number;
  rowIndex: number;
}

/** Placeholder data until real CSV parsing is integrated. */
const PLACEHOLDER_PARSED: ParsedRow[] = [
  { date: '2026-02-20', payee: 'Whole Foods', memo: null, amount: -8523, rowIndex: 0 },
  { date: '2026-02-19', payee: 'Shell Gas', memo: 'Fuel', amount: -4800, rowIndex: 1 },
  { date: '2026-02-18', payee: 'Acme Corp', memo: 'Paycheck', amount: 325000, rowIndex: 2 },
  { date: '2026-02-17', payee: 'Netflix', memo: null, amount: -1599, rowIndex: 3 },
  { date: '2026-02-16', payee: 'Chipotle', memo: null, amount: -1245, rowIndex: 4 },
  { date: '2026-02-15', payee: 'Amazon', memo: 'Household', amount: -3499, rowIndex: 5 },
];

function formatCurrency(cents: number): string {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(abs / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ImportCSVScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('select-file');
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());

  const accounts: Account[] = (() => {
    try {
      return getAccounts(db);
    } catch {
      return [];
    }
  })();
  const selectedAccountId = accounts[0]?.id ?? '';
  const selectedAccountName = accounts[0]?.name ?? 'Checking';
  const transactions = PLACEHOLDER_PARSED;
  const includedCount = transactions.length - excludedRows.size;

  const toggleRow = useCallback((rowIndex: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  }, []);

  const handleImport = useCallback(() => {
    const included = transactions.filter((t) => !excludedRows.has(t.rowIndex));
    for (const t of included) {
      createTransaction(db, uuid(), {
        account_id: selectedAccountId,
        occurred_on: t.date,
        merchant: t.payee,
        note: t.memo ?? undefined,
        amount: t.amount,
        direction: t.amount >= 0 ? 'inflow' : 'outflow',
      });
    }
    router.back();
  }, [db, router, transactions, excludedRows, selectedAccountId]);

  if (step === 'select-file') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.dropzone}>
          <Text style={styles.dropzoneIcon}>{'\u{1F4C4}'}</Text>
          <Text variant="body" style={styles.dropzoneText}>
            Select a CSV file to import
          </Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.dropzoneHint}>
            Supported formats: CSV from most banks
          </Text>
          <Button
            label="Choose File"
            onPress={() => setStep('preview')}
            style={styles.chooseBtn}
          />
        </Card>

        <Text variant="caption" style={styles.sectionHeader}>SAVED PROFILES</Text>
        <Card style={styles.section}>
          <Pressable style={styles.profileRow}>
            <Text variant="body">Chase Checking</Text>
            <Text variant="caption" color={colors.textSecondary}>MM/DD/YYYY</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.profileRow}>
            <Text variant="body">Amex Credit Card</Text>
            <Text variant="caption" color={colors.textSecondary}>MM/DD/YYYY</Text>
          </Pressable>
        </Card>
      </ScrollView>
    );
  }

  if (step === 'preview') {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <Text variant="body" style={styles.previewTitle}>
            {transactions.length} transactions found
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Tap a row to exclude it from import
          </Text>
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.rowIndex)}
          renderItem={({ item }) => {
            const excluded = excludedRows.has(item.rowIndex);
            const isInflow = item.amount > 0;
            return (
              <Pressable
                onPress={() => toggleRow(item.rowIndex)}
                style={[styles.txRow, excluded && styles.txRowExcluded]}
              >
                <View style={styles.txLeft}>
                  <Text
                    variant="body"
                    style={excluded ? styles.excludedText : undefined}
                    numberOfLines={1}
                  >
                    {item.payee}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    excluded && styles.excludedText,
                    isInflow && styles.inflow,
                  ]}
                >
                  {formatCurrency(item.amount)}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footer}>
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setStep('select-file')}
          />
          <Button
            label={`Import ${includedCount} Transactions`}
            onPress={() => setStep('confirm')}
            style={styles.importBtn}
          />
        </View>
      </View>
    );
  }

  // Confirm step
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.confirmCard}>
        <Text variant="subheading" style={styles.confirmTitle}>
          Ready to Import
        </Text>
        <View style={styles.confirmRow}>
          <Text variant="body">Transactions</Text>
          <Text variant="body" style={styles.confirmValue}>{includedCount}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text variant="body">Account</Text>
          <Text variant="body" style={styles.confirmValue}>{selectedAccountName}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text variant="body">Excluded</Text>
          <Text variant="caption" color={colors.textSecondary}>{excludedRows.size}</Text>
        </View>
      </Card>

      <View style={styles.confirmActions}>
        <Button
          variant="secondary"
          label="Back to Preview"
          onPress={() => setStep('preview')}
        />
        <Button
          label="Confirm Import"
          onPress={handleImport}
          style={styles.confirmBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 80,
  },
  dropzone: {
    alignItems: 'center',
    paddingVertical: 40,
    borderStyle: 'dashed',
  },
  dropzoneIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  dropzoneText: {
    marginBottom: spacing.xs,
  },
  dropzoneHint: {
    marginBottom: spacing.lg,
  },
  chooseBtn: {
    minWidth: 160,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  section: {
    padding: 0,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  previewHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  previewTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  txRowExcluded: {
    opacity: 0.4,
  },
  txLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  inflow: {
    color: colors.success,
  },
  excludedText: {
    textDecorationLine: 'line-through',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  importBtn: {
    flex: 1,
  },
  confirmCard: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  confirmTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmValue: {
    color: colors.textSecondary,
  },
  confirmActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  confirmBtn: {
    marginTop: spacing.xs,
  },
});
