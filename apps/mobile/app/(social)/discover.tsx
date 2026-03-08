import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '@mylife/ui';

const SOCIAL_ACCENT = '#7C4DFF';

// TODO: Replace with types from @mylife/social
interface DiscoverItem {
  id: string;
  type: 'user' | 'challenge' | 'group';
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
}

// TODO: Replace with useDiscover() from @mylife/social
const MOCK_ITEMS: DiscoverItem[] = [
  {
    id: 'ch1',
    type: 'challenge',
    title: '30 Books in 2026',
    subtitle: '24 participants',
    icon: '\u{1F4DA}',
    accentColor: '#C9894D',
  },
  {
    id: 'g1',
    type: 'group',
    title: 'Book Club',
    subtitle: '18 members',
    icon: '\u{1F4DA}',
    accentColor: '#C9894D',
  },
  {
    id: 'ch2',
    type: 'challenge',
    title: 'Workout Streak: March',
    subtitle: '56 participants',
    icon: '\u{1F3CB}\uFE0F',
    accentColor: '#EF4444',
  },
  {
    id: 'u1',
    type: 'user',
    title: 'Alex',
    subtitle: '4 modules active',
    icon: '\u{1F464}',
    accentColor: SOCIAL_ACCENT,
  },
  {
    id: 'g2',
    type: 'group',
    title: 'Habit Builders',
    subtitle: '29 members',
    icon: '\u{1F31F}',
    accentColor: '#8B5CF6',
  },
];

type FilterType = 'all' | 'user' | 'challenge' | 'group';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = MOCK_ITEMS.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (
      searchQuery.length > 0 &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, challenges, groups..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'user', label: 'People' },
            { id: 'challenge', label: 'Challenges' },
            { id: 'group', label: 'Groups' },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[
              styles.filterPill,
              filter === f.id && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.id && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: `${item.accentColor}1A` },
              ]}
            >
              <Text style={styles.cardIconText}>{item.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {item.type === 'user'
                  ? 'Person'
                  : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No results found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: SOCIAL_ACCENT,
    borderColor: SOCIAL_ACCENT,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingTop: 4,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 18,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
