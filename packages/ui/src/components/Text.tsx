import React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors } from '../tokens/colors';
import { typography, type TypographyVariant } from '../tokens/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  children: React.ReactNode;
}

export function Text({ variant = 'body', color, style, children, ...props }: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        typography[variant],
        color ? { color } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
