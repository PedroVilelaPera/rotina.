export const tokens = {
  colors: {
    bg: {
      root: '#151312',
      surface: '#1D1B1A',
      elevated: '#262423',
    },
    border: {
      subtle: '#2D2927',
    },
    accent: {
      primary: '#E07A5F',
      onPrimary: '#151312',
    },
    text: {
      primary: '#F5F2F0',
      secondary: '#A8A29E',
    },
    semantic: {
      danger: '#C85A53',
    },
  },
  fonts: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
} as const;

export type DesignTokens = typeof tokens;
export type ColorTokens = typeof tokens.colors;
export type FontTokens = typeof tokens.fonts;
export type RadiiTokens = typeof tokens.radii;
export type SpacingTokens = typeof tokens.spacing;
