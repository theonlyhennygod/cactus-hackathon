import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyzeTimeSeries } from '@/agents';
import { Button } from '@/components/ui/Button';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useVitalsStore } from '@/store';

export default function TremorTestScreen() {
  const router = useRouter();
  const { setVitals } = useVitalsStore();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const accelDataRef = useRef<AccelerometerMeasurement[]>([]);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  // Animation values
  const handShake = useSharedValue(0);
  const dotScale = useSharedValue(1);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50); // 20Hz sampling
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isMeasuring && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isMeasuring) {
      handleMeasurementComplete();
    }
    return () => clearInterval(interval);
  }, [isMeasuring, timeLeft]);

  useEffect(() => {
    if (isMeasuring) {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      dotScale.value = withTiming(1);
    }
  }, [isMeasuring]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: dotScale.value },
      { translateX: handShake.value },
    ],
  }));

  // Animated style for movement indicator bar (avoids reading .value during render)
  const movementFillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.abs(handShake.value) * 5)}%`,
  }));

  const startMeasurement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    accelDataRef.current = [];
    setIsMeasuring(true);
    setTimeLeft(10);

    subscriptionRef.current = Accelerometer.addListener((data) => {
      accelDataRef.current.push(data);
      // Update shake animation based on actual movement
      const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
      handShake.value = (magnitude - 1) * 20; // Visualize deviation from gravity
    });

    console.log('📊 Tremor test started...');
  };

  const handleMeasurementComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsMeasuring(false);
    setIsProcessing(true);

    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    try {
      console.log('📊 Processing tremor data...', accelDataRef.current.length, 'samples');

      // Pass raw accelerometer data (not magnitudes) to analyzeTimeSeries
      // First param is PPG data (empty for tremor test), second is accelerometer data
      const result = await analyzeTimeSeries([], accelDataRef.current);

      console.log('✋ Tremor analysis result:', result);

      // Use tremorIndex from the result, or calculate locally
      const accelMagnitudes = accelDataRef.current.map((d) =>
        Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
      );
      const tremor = result.tremorIndex || calculateTremorSeverity(accelMagnitudes);

      setVitals({
        tremorIndex: Math.round(tremor * 10) / 10,
      });

      setIsProcessing(false);
      router.back();
    } catch (error) {
      console.error('Tremor analysis error:', error);
      // Fallback calculation
      const accelArray = accelDataRef.current.map((d) =>
        Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
      );
      const tremor = calculateTremorSeverity(accelArray);
      setVitals({ tremorIndex: Math.round(tremor * 10) / 10 });
      setIsProcessing(false);
      router.back();
    }
  };

  const calculateTremorSeverity = (data: number[]): number => {
    if (data.length < 10) return 0;

    // Calculate variance from gravity (1g)
    const deviations = data.map((v) => Math.abs(v - 1));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

    // Calculate high-frequency component (tremor is typically 4-12 Hz)
    let highFreqEnergy = 0;
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(data[i] - data[i - 1]);
      highFreqEnergy += diff * diff;
    }
    highFreqEnergy = Math.sqrt(highFreqEnergy / data.length);

    // Combine metrics (0-10 scale)
    const severity = Math.min(10, (avgDeviation * 20 + highFreqEnergy * 100));
    return severity;
  };

  const handleClose = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
    }
    router.back();
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[palette.warning[500], palette.warning[600]]}
          style={styles.processingContainer}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.processingContent}>
            <View style={styles.processingIcon}>
              <Ionicons name="hand-left" size={48} color={palette.white} />
            </View>
            <Text style={styles.processingTitle}>Analyzing Tremor Data</Text>
            <Text style={styles.processingSubtitle}>
              Processing movement patterns...
            </Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Tremor Assessment</Text>
      </SafeAreaView>

      {/* Measurement View */}
      <View style={styles.measurementContainer}>
        <LinearGradient
          colors={[palette.warning[50], palette.warning[100]]}
          style={styles.measurementBackground}
        >
          <View style={styles.measurementContent}>
            {/* Hand Icon with Tracking Dot */}
            <View style={styles.handContainer}>
              <Ionicons name="hand-left-outline" size={120} color={palette.warning[400]} />
              <Animated.View style={[styles.trackingDot, dotStyle, isMeasuring && styles.trackingDotActive]} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>
                {isMeasuring ? 'Hold Still...' : 'Tremor Test'}
              </Text>
              <Text style={styles.instructionText}>
                {isMeasuring
                  ? 'Try to keep your hand as steady as possible'
                  : 'Hold your phone in your extended hand'}
              </Text>
            </View>

            {/* Live Movement Indicator */}
            {isMeasuring && (
              <View style={styles.movementIndicator}>
                <View style={styles.movementBar}>
                  <Animated.View
                    style={[
                      styles.movementFill,
                      movementFillStyle,
                    ]}
                  />
                </View>
                <Text style={styles.movementLabel}>Movement detected</Text>
              </View>
            )}

            {/* Tips */}
            {!isMeasuring && (
              <View style={styles.tipsContainer}>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color={palette.success[500]} />
                  <Text style={styles.tipText}>Extend your arm forward</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color={palette.success[500]} />
                  <Text style={styles.tipText}>Keep phone screen facing up</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color={palette.success[500]} />
                  <Text style={styles.tipText}>Stay relaxed during test</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.stepTitle}>
            {isMeasuring ? 'Measuring...' : 'Ready to Start'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isMeasuring
              ? 'Analyzing hand stability'
              : 'Test measures micro-movements and tremor patterns'}
          </Text>

          {isMeasuring && timeLeft > 0 && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timer, { color: palette.warning[500] }]}>{timeLeft}</Text>
              <Text style={styles.timerLabel}>seconds remaining</Text>
            </View>
          )}

          {!isMeasuring && (
            <Button
              title="Start Tremor Test"
              icon="hand-left"
              size="lg"
              fullWidth
              onPress={startMeasurement}
              style={{ marginTop: spacing.md, backgroundColor: palette.warning[500] }}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: Colors.light.surface,
    ...shadows.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
  },
  measurementContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  measurementBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  handContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  trackingDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.warning[300],
    top: 40,
    right: 30,
  },
  trackingDotActive: {
    backgroundColor: palette.warning[500],
    shadowColor: palette.warning[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  instructionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: palette.warning[700],
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: typography.size.md,
    color: palette.warning[600],
    textAlign: 'center',
  },
  movementIndicator: {
    width: '100%',
    alignItems: 'center',
  },
  movementBar: {
    width: '80%',
    height: 8,
    backgroundColor: palette.warning[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  movementFill: {
    height: '100%',
    backgroundColor: palette.warning[500],
    borderRadius: 4,
  },
  movementLabel: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: palette.warning[600],
  },
  tipsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    fontSize: typography.size.md,
    color: palette.warning[700],
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...shadows.lg,
  },
  stepTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  timer: {
    fontSize: 72,
    fontWeight: typography.weight.bold,
  },
  timerLabel: {
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
    marginTop: spacing.xs,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingContent: {
    alignItems: 'center',
  },
  processingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  processingTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: palette.white,
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    fontSize: typography.size.md,
    color: 'rgba(255,255,255,0.9)',
  },
});
