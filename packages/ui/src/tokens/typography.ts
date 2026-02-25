export const typography = {
  heading: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700' as const,
  },
  subheading: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  stat: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: '700' as const,
  },

  // Module-specific fonts
  bookTitle: {
    fontFamily: 'Literata',
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  bookAuthor: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  bookReview: {
    fontFamily: 'Literata',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
