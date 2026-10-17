import { palette, spacing, radii, typography, shadows } from './tokens';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryHover: string;
  primarySubtle: string;
  primaryText: string;
  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  overlay: string;
  card: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightColors: ThemeColors = {
  background: palette.slate50,
  surface: palette.pureWhite,
  surfaceRaised: palette.pureWhite,
  surfaceSubtle: palette.slate100,
  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  textInverse: palette.pureWhite,
  border: palette.slate200,
  borderSubtle: palette.slate100,
  primary: palette.brand500,
  primaryHover: palette.brand600,
  primarySubtle: palette.brand50,
  primaryText: palette.pureWhite,
  success: palette.teal600,
  successSubtle: palette.teal50,
  danger: palette.danger500,
  dangerSubtle: palette.danger50,
  overlay: palette.overlayDark,
  card: palette.pureWhite,
  tabBar: palette.pureWhite,
  tabBarBorder: palette.slate200,
  tabBarActive: palette.brand500,
  tabBarInactive: palette.slate400,
};

export const darkColors: ThemeColors = {
  background: palette.slate950,
  surface: palette.slate900,
  surfaceRaised: palette.slate800,
  surfaceSubtle: palette.slate800,
  textPrimary: palette.slate50,
  textSecondary: palette.slate300,
  textMuted: palette.slate500,
  textInverse: palette.slate950,
  border: palette.slate700,
  borderSubtle: palette.slate800,
  primary: palette.brand400,
  primaryHover: palette.brand500,
  primarySubtle: palette.brand800,
  primaryText: palette.slate950,
  success: palette.teal500,
  successSubtle: palette.slate800,
  danger: palette.danger500,
  dangerSubtle: palette.slate800,
  overlay: palette.overlayDark,
  card: palette.slate900,
  tabBar: palette.slate900,
  tabBarBorder: palette.slate800,
  tabBarActive: palette.brand400,
  tabBarInactive: palette.slate500,
};

export const theme = {
  light: {
    colors: lightColors,
    spacing,
    radii,
    typography,
    shadows,
  },
  dark: {
    colors: darkColors,
    spacing,
    radii,
    typography,
    shadows,
  },
};

export type AppTheme = typeof theme.light;
