import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

const PHASE_DURATION = 4000;

export default function BreathingCoach() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [cycleCount, setCycleCount] = useState(0);
  const activeRef = useRef(false);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);
  const ringScale = useSharedValue(1);

  const runBreathCycle = async () => {
    if (!activeRef.current) return;

    // Inhale
    setPhase('inhale');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak('Breathe in', { rate: 0.8 });
    scale.value = withTiming(1.4, { duration: PHASE_DURATION, easing: Easing.inOut(Easing.ease) });
    opacity.value = withTiming(0.8, { duration: PHASE_DURATION });
    
    await sleep(PHASE_DURATION);
    if (!activeRef.current) return;

    // Hold
    setPhase('hold');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak('Hold', { rate: 0.8 });
    
    await sleep(PHASE_DURATION);
    if (!activeRef.current) return;

    // Exhale
    setPhase('exhale');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak('Breathe out', { rate: 0.8 });
    scale.value = withTiming(1, { duration: PHASE_DURATION, easing: Easing.inOut(Easing.ease) });
    opacity.value = withTiming(0.3, { duration: PHASE_DURATION });
    
    await sleep(PHASE_DURATION);
    if (!activeRef.current) return;

    setCycleCount((c) => c + 1);
    runBreathCycle();
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const toggleSession = () => {
    if (isActive) {
      activeRef.current = false;
      setIsActive(false);
      setPhase('idle');
      Speech.stop();
      scale.value = withSpring(1);
      opacity.value = withTiming(0.3);
      ringScale.value = withSpring(1);
    } else {
      activeRef.current = true;
      setIsActive(true);
      setCycleCount(0);
      
      // Start ring pulse animation
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
      
      runBreathCycle();
    }
  };

  useEffect(() => {
    return () => {
      activeRef.current = false;
      Speech.stop();
    };
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      default:
        return 'Ready';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return palette.primary[500];
      case 'hold':
        return palette.warning[500];
      case 'exhale':
        return palette.success[500];
      default:
        return palette.primary[400];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="leaf" size={20} color={Colors.light.primary} />
        </View>
        <View>
          <Text style={styles.title}>Breathing Coach</Text>
          <Text style={styles.subtitle}>4-4-4 Box Breathing</Text>
        </View>
      </View>

      <View style={styles.visualContainer}>
        {/* Outer ring */}
        <Animated.View style={[styles.outerRing, ringStyle, isActive && { borderColor: getPhaseColor() }]} />
        
        {/* Main breathing circle */}
        <Animated.View style={[styles.circleContainer, circleStyle]}>
          <LinearGradient
            colors={[getPhaseColor(), getPhaseColor() + 'CC']}
            style={styles.circle}
          >
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
            {isActive && (
              <Text style={styles.cycleText}>Cycle {cycleCount + 1}</Text>
            )}
          </LinearGradient>
        </Animated.View>
      </View>

      <Pressable
        onPress={toggleSession}
        style={({ pressed }) => [
          styles.button,
          isActive ? styles.buttonStop : styles.buttonStart,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons
          name={isActive ? 'pause' : 'play'}
          size={20}
          color={isActive ? palette.danger[600] : palette.white}
        />
        <Text style={[styles.buttonText, isActive && styles.buttonTextStop]}>
          {isActive ? 'Stop Session' : 'Start Breathing'}
        </Text>
      </Pressable>

      {!isActive && (
        <Text style={styles.hint}>
          Follow the visual guide to reduce stress and improve focus
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
  },
  visualContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  outerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  circleContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    ...shadows.lg,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: palette.white,
  },
  cycleText: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  buttonStart: {
    backgroundColor: Colors.light.primary,
  },
  buttonStop: {
    backgroundColor: palette.danger[100],
    borderWidth: 1,
    borderColor: palette.danger[200],
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    marginLeft: spacing.sm,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: palette.white,
  },
  buttonTextStop: {
    color: palette.danger[600],
  },
  hint: {
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
});
