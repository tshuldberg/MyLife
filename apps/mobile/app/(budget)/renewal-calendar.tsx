import { useEffect, useMemo, useState } from 'react';
import { SectionList, View, StyleSheet } from 'react-native';
import { getSubscriptions, type BudgetSubscription } from '@mylife/budget';
import { Text, Card, colors, spacing } from '@mylife/ui';
import { useDatabase } from '../../components/DatabaseProvider';

const BUDGET_ACCENT = colors.modules.budget;

interface CalendarSection {
  title: string;
  totalCost: number;
  data: BudgetSubscription[];
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function groupByWeek(subs: BudgetSubscription[]): CalendarSection[] {
  const today = new Date();
  const sections: CalendarSection[] = [];

  const thisWeekEnd = new Date(today);
  thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));

  const nextWeekEnd = new Date(thisWeekEnd);
  nextWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const buckets: { title: string; subs: BudgetSubscription[] }[] = [
    { title: 'This Week', subs: [] },
    { title: 'Next Week', subs: [] },
    { title: 'Later This Month', subs: [] },
  ];

  for (const sub of subs) {
    if (!sub.next_renewal) continue;
    const [y, m, d] = sub.next_renewal.split('-').map(Number);
    const renewal = new Date(y, m - 1, d);

    if (renewal <= thisWeekEnd) {
      buckets[0].subs.push(sub);
    } else if (renewal <= nextWeekEnd) {
      buckets[1].subs.push(sub);
    } else {
      buckets[2].subs.push(sub);
    }
  }

  for (const bucket of buckets) {
    if (bucket.subs.length > 0) {
      const totalCost = bucket.subs.reduce((sum, s) => sum + s.price, 0);
      sections.push({ title: bucket.title, totalCost, data: bucket.subs });
    }
  }

  return sections;
}

function formatRenewalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function RenewalCalendarScreen() {
  const db = useDatabase();
  const [subscriptions, setSubscriptions] = useState<BudgetSubscription[]>([]);

  useEffect(() => {
    try {
      const all = getSubscriptions(db);
      setSubscriptions(all.filter((s) => s.status === 'active' || s.status === 'trial'));
    } catch {
      setSubscriptions([]);
    }
  }, [db]);

  const upcoming = useMemo(
    () => subscriptions.filter((s) => s.next_renewal),
    [subscriptions],
  );

  const sections = useMemo(() => groupByWeek(upcoming), [upcoming]);

  const monthTotal = useMemo(
    () => upcoming.reduce((sum, s) => sum + s.price, 0),
    [upcoming],
  );

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <Card style={styles.totalCard}>
          <Text variant="caption" style={styles.totalLabel}>
            Due in next 30 days
          </Text>
          <Text style={styles.totalAmount}>{formatCurrency(monthTotal)}</Text>
          <Text variant="caption" color={colors.textSecondary}>
            {upcoming.length} renewals
          </Text>
        </Card>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text variant="caption" style={styles.sectionTitle}>
            {section.title.toUpperCase()}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            {formatCurrency(section.totalCost)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.left}>
              {item.icon ? (
                <Text style={styles.icon}>{item.icon}</Text>
              ) : null}
              <View>
                <Text variant="body">{item.name}</Text>
                {item.next_renewal ? (
                  <Text variant="caption" color={colors.textSecondary}>
                    {formatRenewalDate(item.next_renewal)}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          </View>
        </Card>
      )}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text variant="body" color={colors.textSecondary}>
            No upcoming renewals
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            All clear for the next 30 days
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  totalCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  totalLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: BUDGET_ACCENT,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  icon: {
    fontSize: 18,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: BUDGET_ACCENT,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.xs,
  },
});
