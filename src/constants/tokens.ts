/**
 * Semantic Design Tokens for the Video-First India Marketplace
 * Unique visual identity: Modern, accessible, warm India-focused color palette.
 */

export const palette = {
  // Brand Warm Accents (Saffron / Marigold Ember)
  brand50: '#FFF7ED',
  brand100: '#FFEDD5',
  brand200: '#FED7AA',
  brand300: '#FDBA74',
  brand400: '#FB923C',
  brand500: '#E85D04', // Primary Brand
  brand600: '#D9480F',
  brand700: '#9A3412',
  brand800: '#7C2D12',

  // Trust / Verification Teal / Emerald
  teal50: '#ECFDF5',
  teal100: '#D1FAE5',
  teal500: '#10B981',
  teal600: '#059669', // Verified badge / success
  teal700: '#047857',

  // Alert & Danger
  danger50: '#FEF2F2',
  danger500: '#EF4444',
  danger600: '#DC2626',

  // Neutral / Slate
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  pureWhite: '#FFFFFF',
  pureBlack: '#000000',
  overlayDark: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(255, 255, 255, 0.85)',
};

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const typography = {
  titleLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  titleSmall: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  headline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
  badge: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
