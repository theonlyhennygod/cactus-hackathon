import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyzeAudio } from '@/agents';
import { Button } from '@/components/ui/Button';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useVitalsStore } from '@/store';

export default function LungSoundScreen() {
  const router = useRouter();
  const { setVitals } = useVitalsStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioUriRef = useRef<string | null>(null);

  // Animation values
  const waveScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.5);

  useEffect(() => {
    checkPermission();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {
          // Ignore error if already unloaded
        });
        recordingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      handleRecordingComplete();
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  useEffect(() => {
    if (isRecording) {
      waveScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.5, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      waveScale.value = withSpring(1);
      waveOpacity.value = withTiming(0.5);
    }
  }, [isRecording]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  const checkPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await checkPermission();
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setTimeLeft(8); // 8 seconds for lung sound recording
      console.log('🎤 Recording started for lung sound analysis...');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleRecordingComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(false);
    setIsProcessing(true);

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null; // Clear ref to prevent double unload
        audioUriRef.current = uri;
        console.log('🎤 Recording stopped, analyzing...', uri);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        // Analyze audio
        const result = await analyzeAudio(uri || '');
        console.log('🫁 Lung sound analysis result:', result);

        // Update vitals
        setVitals({
          breathingRate: result.breathingRate,
          coughType: result.coughType,
        });

        setIsProcessing(false);
        router.back();
      }
    } catch (error) {
      console.error('Lung sound analysis error:', error);
      // Fallback values
      setVitals({
        breathingRate: 16,
        coughType: 'none',
      });
      setIsProcessing(false);
      router.back();
    }
  };

  const handleClose = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
    }
    router.back();
  };

  if (permissionGranted === false) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="mic-outline" size={64} color={palette.info[500]} />
          </View>
          <Text style={styles.permissionTitle}>Microphone Access Required</Text>
          <Text style={styles.permissionText}>
            We need microphone access to analyze your lung sounds for respiratory assessment.
          </Text>
          <Button
            title="Grant Microphone Access"
            icon="mic-outline"
            onPress={checkPermission}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[palette.info[500], palette.info[600]]}
          style={styles.processingContainer}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.processingContent}>
            <View style={styles.processingIcon}>
              <Ionicons name="medical" size={48} color={palette.white} />
            </View>
            <Text style={styles.processingTitle}>Analyzing Lung Sounds</Text>
            <Text style={styles.processingSubtitle}>
              Processing respiratory audio patterns...
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
        <Text style={styles.headerTitle}>Lung Sound Analysis</Text>
      </SafeAreaView>

      {/* Recording View */}
      <View style={styles.recordingContainer}>
        <LinearGradient
          colors={[palette.info[50], palette.info[100]]}
          style={styles.recordingBackground}
        >
          <View style={styles.recordingContent}>
            {/* Wave Animation */}
            <View style={styles.waveContainer}>
              <Animated.View style={[styles.wave, styles.waveOuter, waveStyle]} />
              <Animated.View style={[styles.wave, styles.waveMiddle, waveStyle]} />
              <View style={[styles.wave, styles.waveInner, isRecording && styles.waveActive]}>
                <Ionicons
                  name={isRecording ? 'mic' : 'mic-outline'}
                  size={48}
                  color={isRecording ? palette.white : palette.info[500]}
                />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>
                {isRecording ? 'Recording...' : 'Lung Sound Recording'}
              </Text>
              <Text style={styles.instructionText}>
                {isRecording
                  ? 'Breathe deeply near the microphone'
                  : 'Hold your phone near your chest and breathe deeply'}
              </Text>
            </View>

            {/* Sound Wave Visualization */}
            {isRecording && (
              <View style={styles.waveformContainer}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: Math.random() * 40 + 10,
                        backgroundColor: palette.info[400],
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.stepTitle}>
            {isRecording ? 'Keep Breathing' : 'Start Recording'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isRecording
              ? 'Continue slow, deep breaths'
              : 'Take slow, deep breaths during recording'}
          </Text>

          {isRecording && timeLeft > 0 && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timer, { color: palette.info[500] }]}>{timeLeft}</Text>
              <Text style={styles.timerLabel}>seconds remaining</Text>
            </View>
          )}

          {!isRecording && (
            <Button
              title="Start Recording"
              icon="mic"
              size="lg"
              fullWidth
              onPress={startRecording}
              style={{ marginTop: spacing.md, backgroundColor: palette.info[500] }}
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
  recordingContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  recordingBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContent: {
    alignItems: 'center',
  },
  waveContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveOuter: {
    width: 180,
    height: 180,
    backgroundColor: palette.info[200],
    opacity: 0.3,
  },
  waveMiddle: {
    width: 140,
    height: 140,
    backgroundColor: palette.info[300],
    opacity: 0.5,
  },
  waveInner: {
    width: 100,
    height: 100,
    backgroundColor: palette.info[100],
    borderWidth: 3,
    borderColor: palette.info[300],
  },
  waveActive: {
    backgroundColor: palette.info[500],
    borderColor: palette.info[600],
  },
  instructionContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  instructionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: palette.info[700],
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: typography.size.md,
    color: palette.info[600],
    textAlign: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    height: 60,
    gap: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
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
    backgroundColor: palette.info[100],
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
    marginBottom: spacing.xl,
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
