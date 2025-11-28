import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const colors = Colors.light;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (!disabled && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyles = () => {
    const isDisabled = disabled || isLoading;
    
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? palette.neutral[300] : colors.primary,
          },
          text: { color: colors.textInverse },
          icon: colors.textInverse,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled ? palette.neutral[100] : colors.primaryLight,
          },
          text: { color: isDisabled ? palette.neutral[400] : colors.primary },
          icon: isDisabled ? palette.neutral[400] : colors.primary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: isDisabled ? palette.neutral[300] : colors.primary,
          },
          text: { color: isDisabled ? palette.neutral[400] : colors.primary },
          icon: isDisabled ? palette.neutral[400] : colors.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: isDisabled ? palette.neutral[400] : colors.primary },
          icon: isDisabled ? palette.neutral[400] : colors.primary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDisabled ? palette.neutral[300] : colors.danger,
          },
          text: { color: colors.textInverse },
          icon: colors.textInverse,
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: colors.textInverse },
          icon: colors.textInverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
          text: { fontSize: typography.size.sm },
          icon: 16,
        };
      case 'lg':
        return {
          container: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
          text: { fontSize: typography.size.lg },
          icon: 24,
        };
      default:
        return {
          container: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
          text: { fontSize: typography.size.md },
          icon: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const renderContent = () => (
    <View style={styles.content}>
      {isLoading ? (
        <ActivityIndicator color={variantStyles.icon} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles.icon}
              color={variantStyles.icon}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles.icon}
              color={variantStyles.icon}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        variant === 'primary' && shadows.md,
        animatedStyle,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.weight.semibold,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
