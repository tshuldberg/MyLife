import type { ViewStyle } from 'react-native';

/** Glass morphism presets for the Cool Obsidian theme. */

export const glass = {
  /** Standard glass card -- subtle translucent background */
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
  } satisfies ViewStyle,

  /** Stronger glass -- slightly more opaque for elevated surfaces */
  strong: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
  } satisfies ViewStyle,

  /** Dock glass -- heavy blur background for bottom dock */
  dock: {
    backgroundColor: 'rgba(18,18,26,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
  } satisfies ViewStyle,
} as const;

/**
 * CSS `backdrop-filter` values for web glass morphism.
 * React Native uses expo-blur's BlurView instead.
 */
export const glassWeb = {
  card: 'blur(40px) saturate(180%)',
  strong: 'blur(60px) saturate(200%)',
  dock: 'blur(80px) saturate(200%)',
} as const;
