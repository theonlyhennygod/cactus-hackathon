/**
 * Pocket Doctor Design System
 * A calming, professional wellness-focused theme
 */

import { Platform, StyleSheet } from 'react-native';

// Primary wellness color palette
export const palette = {
  // Primary - Calming teal/cyan
  primary: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
  // Secondary - Warm coral for accents
  secondary: {
    50: '#FFF5F5',
    100: '#FED7D7',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56565',
    500: '#E53E3E',
    600: '#C53030',
    700: '#9B2C2C',
    800: '#822727',
    900: '#63171B',
  },
  // Success - Health green
  success: {
    50: '#F0FFF4',
    100: '#C6F6D5',
    200: '#9AE6B4',
    300: '#68D391',
    400: '#48BB78',
    500: '#38A169',
    600: '#2F855A',
    700: '#276749',
    800: '#22543D',
    900: '#1C4532',
  },
  // Warning - Attention amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  // Danger - Alert red
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  // Neutral grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  // Info - Blue for informational content
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Pure
  white: '#FFFFFF',
  black: '#000000',
};

export const Colors = {
  light: {
    // Backgrounds
    background: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F7FAFC',
    
    // Text
    text: '#1A202C',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    textInverse: '#FFFFFF',
    
    // Brand
    primary: palette.primary[500],
    primaryLight: palette.primary[100],
    primaryDark: palette.primary[700],
    
    // Semantic
    success: palette.success[500],
    successLight: palette.success[100],
    warning: palette.warning[500],
    warningLight: palette.warning[100],
    danger: palette.danger[500],
    dangerLight: palette.danger[100],
    
    // UI Elements
    border: '#E2E8F0',
    borderLight: '#EDF2F7',
    divider: '#E2E8F0',
    
    // Interactive
    tint: palette.primary[500],
    icon: '#64748B',
    iconActive: palette.primary[500],
    
    // Tab bar
    tabIconDefault: '#94A3B8',
    tabIconSelected: palette.primary[500],
    
    // Cards & shadows
    cardBackground: '#FFFFFF',
    shadowColor: '#000000',
  },
  dark: {
    // Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    
    // Text
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textInverse: '#0F172A',
    
    // Brand
    primary: palette.primary[400],
    primaryLight: palette.primary[800],
    primaryDark: palette.primary[300],
    
    // Semantic
    success: palette.success[400],
    successLight: palette.success[900],
    warning: palette.warning[400],
    warningLight: palette.warning[900],
    danger: palette.danger[400],
    dangerLight: palette.danger[900],
    
    // UI Elements
    border: '#334155',
    borderLight: '#475569',
    divider: '#334155',
    
    // Interactive
    tint: palette.primary[400],
    icon: '#94A3B8',
    iconActive: palette.primary[400],
    
    // Tab bar
    tabIconDefault: '#64748B',
    tabIconSelected: palette.primary[400],
    
    // Cards & shadows
    cardBackground: '#1E293B',
    shadowColor: '#000000',
  },
};

// Spacing scale (4px base)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Typography
export const typography = {
  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  // Font weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Shadows
export const shadows = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 12,
  },
});

// Status colors for vitals
export const vitalStatus = {
  excellent: palette.success[500],
  good: palette.success[400],
  normal: palette.primary[500],
  caution: palette.warning[500],
  concern: palette.danger[500],
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
