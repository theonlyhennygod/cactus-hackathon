import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useCheckInStore, useVitalsStore } from '@/store';
import { startAccelerometer, stopAccelerometer } from '@/utils/sensorHelpers';

const STEPS = [
  { key: 'face', label: 'Face', icon: 'scan-outline' as const },
  { key: 'cough', label: 'Cough', icon: 'mic-outline' as const },
  { key: 'tremor', label: 'Tremor', icon: 'hand-left-outline' as const },
];

export default function CaptureFlow() {
  const { step, setStep, isCapturing, setIsCapturing, reset } = useCheckInStore();
  const { setVitals } = useVitalsStore();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const cameraRef = useRef<CameraView>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (step === 'face' && !permission?.granted) {
      requestPermission();
    }
    if (step === 'cough' && !audioPermission?.granted) {
      requestAudioPermission();
    }
  }, [step, permission, audioPermission]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCapturing && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isCapturing) {
      handleStepComplete();
    }
    return () => clearInterval(interval);
  }, [isCapturing, timeLeft]);

  // Pulse animation for capturing state
  useEffect(() => {
    if (isCapturing) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isCapturing]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCapturing(true);

    if (step === 'face') {
      setTimeLeft(10);
    } else if (step === 'cough') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setTimeLeft(10);
      } catch (err) {
        console.error('Failed to start recording', err);
        setIsCapturing(false);
      }
    } else if (step === 'tremor') {
      startAccelerometer();
      setTimeLeft(10);
    }
  };

  const handleStepComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCapturing(false);
    setCompletedSteps((prev) => [...prev, step]);

    if (step === 'face') {
      // Simulate PPG processing
      setVitals({ 
        heartRate: 68 + Math.floor(Math.random() * 15),
        hrv: 40 + Math.floor(Math.random() * 30),
      });
      setStep('cough');
    } else if (step === 'cough') {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setVitals({ 
        breathingRate: 14 + Math.floor(Math.random() * 6),
        coughType: 'dry',
      });
      setStep('tremor');
    } else if (step === 'tremor') {
      const data = stopAccelerometer();
      console.log('Accelerometer data points:', data.length);
      setVitals({ tremorIndex: Math.random() * 2 });
      setStep('processing');
      
      // Simulate AI processing
      setTimeout(() => {
        setStep('results');
        router.replace('/results');
      }, 2500);
    }
  };

  const handleClose = () => {
    reset();
    router.back();
  };

  const getStepConfig = () => {
    switch (step) {
      case 'face':
        return {
          title: 'Face Scan',
          subtitle: 'Analyzing PPG signals for heart rate',
          icon: 'scan-outline' as const,
          instruction: 'Position your face in the frame',
          color: palette.primary[500],
        };
      case 'cough':
        return {
          title: 'Respiratory Check',
          subtitle: 'Recording breathing patterns',
          icon: 'mic-outline' as const,
          instruction: 'Cough 3 times clearly',
          color: palette.warning[500],
        };
      case 'tremor':
        return {
          title: 'Stability Test',
          subtitle: 'Measuring hand steadiness',
          icon: 'hand-left-outline' as const,
          instruction: 'Hold the phone steady',
          color: palette.success[500],
        };
      case 'processing':
        return {
          title: 'Analyzing',
          subtitle: 'AI is processing your data',
          icon: 'analytics-outline' as const,
          instruction: 'Please wait...',
          color: palette.primary[500],
        };
      default:
        return {
          title: 'Check-In',
          subtitle: '',
          icon: 'medical-outline' as const,
          instruction: '',
          color: palette.primary[500],
        };
    }
  };

  const config = getStepConfig();

  // Permission request screen
  if (!permission || !audioPermission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted || !audioPermission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="shield-checkmark-outline" size={64} color={Colors.light.primary} />
          </View>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            We need camera and microphone access to analyze your health metrics. All processing happens locally on your device.
          </Text>
          <View style={styles.permissionButtons}>
            <Button
              title="Grant Camera Access"
              icon="camera-outline"
              onPress={requestPermission}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Grant Microphone Access"
              icon="mic-outline"
              variant="secondary"
              onPress={requestAudioPermission}
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.light.text} />
        </Pressable>
        
        {step !== 'processing' && (
          <ProgressSteps
            steps={STEPS}
            currentStep={step}
            completedSteps={completedSteps}
          />
        )}
      </SafeAreaView>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Face Scan with Camera */}
        {step === 'face' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing="front" ref={cameraRef} />
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
              style={styles.cameraOverlay}
              pointerEvents="none"
            >
              {/* Face guide circle */}
              <Animated.View style={[styles.faceGuide, pulseStyle, isCapturing && styles.faceGuideActive]}>
                {isCapturing && (
                  <View style={styles.scanLine} />
                )}
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Audio Recording View */}
        {step === 'cough' && (
          <Animated.View 
            entering={FadeIn.duration(400)} 
            style={styles.sensorContainer}
          >
            <LinearGradient
              colors={[palette.warning[50], palette.warning[100]]}
              style={styles.sensorGradient}
            >
              <Animated.View style={[styles.sensorIcon, pulseStyle]}>
                <Ionicons name="mic" size={64} color={palette.warning[500]} />
              </Animated.View>
              {isCapturing && (
                <View style={styles.soundWaves}>
                  {[...Array(5)].map((_, i) => (
                    <SoundWave key={i} delay={i * 100} />
                  ))}
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Tremor Test View */}
        {step === 'tremor' && (
          <Animated.View 
            entering={FadeIn.duration(400)} 
            style={styles.sensorContainer}
          >
            <LinearGradient
              colors={[palette.success[50], palette.success[100]]}
              style={styles.sensorGradient}
            >
              <Animated.View style={[styles.sensorIcon, pulseStyle]}>
                <Ionicons name="hand-left" size={64} color={palette.success[500]} />
              </Animated.View>
              {isCapturing && (
                <View style={styles.steadyIndicator}>
                  <View style={styles.steadyDot} />
                  <Text style={styles.steadyText}>Keep Steady</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Processing View */}
        {step === 'processing' && (
          <Animated.View 
            entering={FadeIn.duration(400)} 
            style={styles.processingContainer}
          >
            <ProcessingAnimation />
            <Text style={styles.processingTitle}>Analyzing Your Health Data</Text>
            <Text style={styles.processingSubtitle}>
              Our AI is processing your vitals using on-device models
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.stepTitle}>{config.title}</Text>
          <Text style={styles.stepSubtitle}>{config.subtitle}</Text>
          
          {isCapturing && timeLeft > 0 && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timer, { color: config.color }]}>{timeLeft}</Text>
              <Text style={styles.timerLabel}>seconds remaining</Text>
            </View>
          )}

          {!isCapturing && step !== 'processing' && (
            <Button
              title="Start Capture"
              icon="play"
              size="lg"
              fullWidth
              onPress={startCapture}
              style={{ marginTop: spacing.md }}
            />
          )}

          {isCapturing && (
            <Text style={styles.instruction}>{config.instruction}</Text>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Sound wave animation component
function SoundWave({ delay }: { delay: number }) {
  const height = useSharedValue(20);

  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(60 + Math.random() * 40, { duration: 300 + delay }),
        withTiming(20 + Math.random() * 20, { duration: 300 + delay })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.soundWave, animatedStyle]} />
  );
}

// Processing animation component
function ProcessingAnimation() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.processingIcon, animatedStyle]}>
      <LinearGradient
        colors={[palette.primary[400], palette.primary[600]]}
        style={styles.processingGradient}
      >
        <Ionicons name="analytics" size={48} color={palette.white} />
      </LinearGradient>
    </Animated.View>
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
  content: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: 280,
    height: 360,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceGuideActive: {
    borderColor: palette.primary[400],
    borderStyle: 'solid',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: palette.primary[400],
    opacity: 0.8,
  },
  sensorContainer: {
    flex: 1,
  },
  sensorGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  soundWaves: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    height: 100,
  },
  soundWave: {
    width: 8,
    backgroundColor: palette.warning[400],
    borderRadius: 4,
    marginHorizontal: 4,
  },
  steadyIndicator: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  steadyDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.success[500],
    marginBottom: spacing.sm,
  },
  steadyText: {
    fontSize: typography.size.md,
    color: palette.success[700],
    fontWeight: typography.weight.medium,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  processingIcon: {
    marginBottom: spacing.xl,
  },
  processingGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  processingTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
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
  instruction: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontWeight: typography.weight.medium,
  },
  permissionContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  permissionTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
  permissionText: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
    marginBottom: spacing.xl,
  },
  permissionButtons: {
    width: '100%',
  },
});
