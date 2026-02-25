import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';

interface CardProps extends ViewProps {
  elevated?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = false, style, children, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    ...shadows.elevated,
  },
});
