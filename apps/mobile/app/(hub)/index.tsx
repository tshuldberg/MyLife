import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { icons } from 'lucide-react-native';
import {
  MODULE_METADATA,
  MODULE_ICONS,
  DOCK_ITEMS,
  USER_VISIBLE_MODULE_IDS,
  type ModuleId,
} from '@mylife/module-registry';
import { Text, colors, spacing, borderRadius } from '@mylife/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = spacing.md;
const GRID_COLUMNS = 4;
const ICON_GAP = spacing.sm;
const ICON_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - ICON_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;
const ICON_BOX = Math.min(ICON_SIZE, 72);

/** Convert "kebab-case" Lucide name to PascalCase key used by the icons map. */
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
}

/** Resolve a Lucide icon component by its kebab-case name. */
function getIcon(name: string) {
  const key = toPascalCase(name);
  return (icons as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[key] ?? null;
}

// ---------------------------------------------------------------------------
// Module Grid Item
// ---------------------------------------------------------------------------

function ModuleGridItem({ moduleId }: { moduleId: ModuleId }) {
  const meta = MODULE_METADATA[moduleId];
  const iconName = MODULE_ICONS[moduleId] ?? 'circle';
  const IconComponent = getIcon(iconName);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.84,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    router.push(`/(${moduleId})` as never);
  }, [router, moduleId]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityLabel={meta.name}
      accessibilityHint={meta.tagline}
    >
      <Animated.View
        style={[
          styles.gridItem,
          { transform: [{ scale }], opacity },
        ]}
      >
        <View
          style={[
            styles.iconBox,
            { backgroundColor: meta.accentColor },
          ]}
        >
          {IconComponent ? (
            <IconComponent size={28} color="#FFFFFF" strokeWidth={1.8} />
          ) : (
            <Text style={styles.fallbackEmoji}>{meta.icon}</Text>
          )}
        </View>
        <Text
          variant="caption"
          color={colors.textSecondary}
          numberOfLines={1}
          style={styles.iconLabel}
        >
          {meta.name.replace('My', '')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Dock Bar
// ---------------------------------------------------------------------------

function DockBar() {
  const router = useRouter();

  return (
    <View style={styles.dockContainer}>
      <BlurView intensity={60} tint="dark" style={styles.dockBlur}>
        <View style={styles.dockInner}>
          {DOCK_ITEMS.map((item) => {
            const DockIcon = getIcon(item.icon);
            const isActive = item.key === 'hub';
            return (
              <Pressable
                key={item.key}
                style={styles.dockTab}
                onPress={() => {
                  if (item.key === 'discover') router.push('/(hub)/discover');
                  else if (item.key === 'settings') router.push('/(hub)/settings');
                }}
                accessibilityLabel={item.label}
              >
                {DockIcon && (
                  <DockIcon
                    size={22}
                    color={isActive ? colors.text : colors.textSecondary}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                )}
                <Text
                  variant="caption"
                  color={isActive ? colors.text : colors.textSecondary}
                  style={styles.dockLabel}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

/**
 * Hub home screen for MyLife mobile.
 * iOS-style 4-column icon grid with glass search pill and dock bar.
 */
export default function HubHomeScreen() {
  const modules = useMemo(() => [...USER_VISIBLE_MODULE_IDS], []);

  const renderItem = useCallback(
    ({ item }: { item: ModuleId }) => <ModuleGridItem moduleId={item} />,
    [],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A0A0F', '#0D0D14']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative light orbs for depth */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      {/* Search Pill */}
      <View style={styles.searchContainer}>
        <BlurView intensity={30} tint="dark" style={styles.searchPill}>
          <View style={styles.searchInner}>
            {(() => {
              const SearchIcon = getIcon('search');
              return SearchIcon ? (
                <SearchIcon size={16} color={colors.textTertiary} strokeWidth={1.5} />
              ) : null;
            })()}
            <Text variant="body" color={colors.textTertiary} style={styles.searchText}>
              Search modules...
            </Text>
          </View>
        </BlurView>
      </View>

      {/* Module Grid */}
      <FlatList<ModuleId>
        data={modules}
        keyExtractor={(item) => item}
        numColumns={GRID_COLUMNS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={styles.gridFooter} />}
      />

      {/* Dock */}
      <DockBar />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Light orbs
  orbTopRight: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139,92,246,0.03)',
  },

  // Search pill
  searchContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  searchPill: {
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchText: {
    fontSize: 14,
  },

  // Grid
  grid: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 120,
  },
  gridRow: {
    gap: ICON_GAP,
    marginBottom: spacing.lg,
  },
  gridItem: {
    width: ICON_BOX,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fallbackEmoji: {
    fontSize: 24,
  },
  iconLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  gridFooter: {
    height: spacing.xxl,
  },

  // Dock
  dockContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  dockBlur: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dockInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(18,18,26,0.65)',
  },
  dockTab: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  dockLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
