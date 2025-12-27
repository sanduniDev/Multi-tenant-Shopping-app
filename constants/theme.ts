/**
 * BazaarX Design System Colors and Theme
 * Based on the UI/UX Design System Documentation
 */

import { Platform } from 'react-native';

// Primary Colors - BazaarX Brand
export const PrimaryColors = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#3B82F6',
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',
  blue900: '#1E3A8A',
};

// Secondary Colors
export const SecondaryColors = {
  indigo: '#4F46E5',
  purple: '#7C3AED',
};

// Neutral Colors
export const GrayColors = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
};

// Semantic Colors
export const SemanticColors = {
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  info: '#0284C7',
  infoBg: '#F0F9FF',
};

// Dark Mode Colors
export const DarkModeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
};

// Theme Colors for light/dark mode
export const Colors = {
  light: {
    text: GrayColors[900],
    textSecondary: GrayColors[600],
    background: '#FFFFFF',
    surface: '#FFFFFF',
    tint: PrimaryColors.blue,
    icon: GrayColors[500],
    tabIconDefault: GrayColors[400],
    tabIconSelected: PrimaryColors.blue,
    border: GrayColors[300],
    inputBorder: GrayColors[300],
    inputBackground: '#FFFFFF',
    placeholder: GrayColors[400],
    cardBackground: '#FFFFFF',
    cardBorder: GrayColors[100],
  },
  dark: {
    text: DarkModeColors.textPrimary,
    textSecondary: DarkModeColors.textSecondary,
    background: DarkModeColors.background,
    surface: DarkModeColors.surface,
    tint: '#FFFFFF',
    icon: DarkModeColors.textSecondary,
    tabIconDefault: DarkModeColors.textSecondary,
    tabIconSelected: '#FFFFFF',
    border: DarkModeColors.border,
    inputBorder: DarkModeColors.border,
    inputBackground: DarkModeColors.surface,
    placeholder: GrayColors[400],
    cardBackground: DarkModeColors.surface,
    cardBorder: DarkModeColors.border,
  },
};

// Spacing based on 4px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Typography
export const Typography = {
  displayLarge: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
  },
  displayMedium: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
  },
};

// Font Families
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
    rounded: 'System',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    mono: 'monospace',
    rounded: 'Roboto',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    mono: 'monospace',
    rounded: 'System',
  },
});

// Shadows - Enhanced for better visibility
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Card Styles - For consistent product card appearance across the app
export const CardStyles = {
  light: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: GrayColors[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dark: {
    backgroundColor: DarkModeColors.surface,
    borderWidth: 1,
    borderColor: DarkModeColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Background colors for screens
export const Backgrounds = {
  light: {
    primary: GrayColors[50],    // #F9FAFB - slight off-white for contrast
    secondary: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  dark: {
    primary: DarkModeColors.background,
    secondary: DarkModeColors.surface,
    elevated: DarkModeColors.surfaceLight,
  },
};

// Animation Durations
export const AnimationDurations = {
  micro: 100,
  short: 200,
  medium: 300,
  long: 400,
};
