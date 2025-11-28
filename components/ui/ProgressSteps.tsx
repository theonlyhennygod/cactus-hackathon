import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Colors, palette, radius, spacing, typography } from '@/constants/theme';

interface Step {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressSteps({ steps, currentStep, completedSteps }: ProgressStepsProps) {
  const colors = Colors.light;

  const getStepStatus = (stepKey: string) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'current';
    return 'pending';
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.key);
        const isLast = index === steps.length - 1;

        return (
          <View key={step.key} style={styles.stepWrapper}>
            <View style={styles.stepContent}>
              <StepIndicator
                icon={step.icon}
                status={status}
                colors={colors}
              />
              <Text
                style={[
                  styles.label,
                  status === 'current' && styles.labelActive,
                  status === 'completed' && styles.labelCompleted,
                ]}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  (status === 'completed' || status === 'current') && styles.connectorActive,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

interface StepIndicatorProps {
  icon: keyof typeof Ionicons.glyphMap;
  status: 'pending' | 'current' | 'completed';
  colors: typeof Colors.light;
}

function StepIndicator({ icon, status, colors }: StepIndicatorProps) {
  const pulseStyle = useAnimatedStyle(() => {
    if (status !== 'current') return { transform: [{ scale: 1 }], opacity: 1 };
    
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(1.1, { duration: 800 }),
              withTiming(1, { duration: 800 })
            ),
            -1,
            true
          ),
        },
      ],
    };
  }, [status]);

  const getStyles = () => {
    switch (status) {
      case 'completed':
        return {
          container: { backgroundColor: colors.success },
          icon: palette.white,
        };
      case 'current':
        return {
          container: { backgroundColor: colors.primary },
          icon: palette.white,
        };
      default:
        return {
          container: { backgroundColor: palette.neutral[200] },
          icon: palette.neutral[400],
        };
    }
  };

  const stepStyles = getStyles();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.indicator, stepStyles.container, pulseStyle]}
    >
      {status === 'completed' ? (
        <Ionicons name="checkmark" size={20} color={stepStyles.icon} />
      ) : (
        <Ionicons name={icon} size={20} color={stepStyles.icon} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContent: {
    alignItems: 'center',
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    fontWeight: typography.weight.medium,
  },
  labelActive: {
    color: Colors.light.primary,
    fontWeight: typography.weight.semibold,
  },
  labelCompleted: {
    color: Colors.light.success,
  },
  connector: {
    width: 24,
    height: 3,
    backgroundColor: Colors.light.border,
    marginHorizontal: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  connectorActive: {
    backgroundColor: Colors.light.primary,
  },
});
