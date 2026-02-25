import React from 'react';
import { StyleSheet, Pressable, Text, type PressableProps } from 'react-native';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { useModuleTheme } from './ModuleThemeProvider';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  /**
   * Preferred button text prop.
   */
  title?: string;
  /**
   * Backward-compatible text prop used by existing app code.
   */
  label?: string;
  /**
   * Optional custom content. If provided, it takes precedence over title/label.
   */
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({
  title,
  label,
  children,
  variant = 'primary',
  style,
  ...props
}: ButtonProps) {
  const { accent } = useModuleTheme();
  const textContent = title ?? label ?? '';
  const textColor =
    variant === 'primary' ? colors.background : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary'
          ? { backgroundColor: pressed ? `${accent}CC` : accent }
          : variant === 'secondary'
            ? styles.secondary
            : styles.ghost,
        pressed && variant === 'secondary' && styles.secondaryPressed,
        pressed && variant === 'ghost' && styles.ghostPressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          { color: textColor },
        ]}
      >
        {children ?? textContent}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostPressed: {
    backgroundColor: colors.surface,
  },
  text: {
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
});
