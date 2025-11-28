import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Colors, radius, shadows, spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  animationDelay?: number;
  animate?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
  animationDelay = 0,
  animate = true,
}: CardProps) {
  const colors = Colors.light;

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.cardBackground,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceSecondary,
        };
      default:
        return {};
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'lg':
        return { padding: spacing.lg };
      default:
        return { padding: spacing.md };
    }
  };

  const content = (
    <View style={[styles.container, getVariantStyles(), getPaddingStyles(), style]}>
      {children}
    </View>
  );

  if (animate) {
    return (
      <Animated.View entering={FadeInUp.delay(animationDelay).duration(400).springify()}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
