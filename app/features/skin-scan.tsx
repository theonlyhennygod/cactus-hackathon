import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

import { analyzeImage } from '@/agents';
import { Button } from '@/components/ui/Button';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useVitalsStore } from '@/store';

export default function SkinScanScreen() {
  const router = useRouter();
  const { setVitals } = useVitalsStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  // Animation values
  const scanProgress = useSharedValue(0);
  const cornerPulse = useSharedValue(1);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isCapturing) {
      captureAndAnalyze();
    }
    return () => clearInterval(interval);
  }, [countdown, isCapturing]);

  useEffect(() => {
    if (isCapturing) {
      scanProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
      cornerPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      scanProgress.value = withSpring(0);
      cornerPulse.value = withSpring(1);
    }
  }, [isCapturing]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanProgress.value * 100}%`,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerPulse.value }],
  }));

  const startCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCapturing(true);
    setCountdown(3);
  };

  const captureAndAnalyze = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCapturing(false);
    setIsProcessing(true);

    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        console.log('📸 Skin image captured:', photo?.uri);

        if (photo?.uri) {
          // Analyze with vision model
          const result = await analyzeImage(photo.uri);
          console.log('🔬 Skin analysis result:', result);

          // Update vitals - only skinCondition exists in VitalsState
          setVitals({
            skinCondition: result.skinCondition || 'Normal',
          });
        } else {
          throw new Error('No photo captured');
        }
      }

      setIsProcessing(false);
      router.back();
    } catch (error) {
      console.error('Skin scan error:', error);
      // Fallback values
      setVitals({
        skinCondition: 'Normal',
      });
      setIsProcessing(false);
      router.back();
    }
  };

  const handleClose = () => {
    setIsCapturing(false);
    router.back();
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="scan-outline" size={64} color={palette.success[500]} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to analyze your skin condition and detect any concerns.
          </Text>
          <Button
            title="Grant Camera Access"
            icon="camera-outline"
            onPress={requestPermission}
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
          colors={[palette.success[500], palette.success[600]]}
          style={styles.processingContainer}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.processingContent}>
            <View style={styles.processingIcon}>
              <Ionicons name="scan" size={48} color={palette.white} />
            </View>
            <Text style={styles.processingTitle}>Analyzing Skin</Text>
            <Text style={styles.processingSubtitle}>
              AI is examining your skin condition...
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
        <Text style={styles.headerTitle}>Skin Analysis</Text>
      </SafeAreaView>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef} />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
          style={styles.cameraOverlay}
          pointerEvents="none"
        >
          {/* Face Frame */}
          <View style={[styles.faceFrame, isCapturing && styles.faceFrameActive]}>
            {isCapturing && (
              <Animated.View style={[styles.scanLine, scanLineStyle]} />
            )}
            
            {/* Animated Corners */}
            <Animated.View style={[styles.corner, styles.cornerTL, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.cornerTR, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.cornerBL, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.cornerBR, cornerStyle]} />
          </View>

          {/* Countdown Display */}
          {countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Scan Areas */}
          {isCapturing && (
            <View style={styles.scanAreasContainer}>
              <View style={styles.scanArea}>
                <Ionicons name="ellipse" size={8} color={palette.success[400]} />
                <Text style={styles.scanAreaText}>Forehead</Text>
              </View>
              <View style={styles.scanArea}>
                <Ionicons name="ellipse" size={8} color={palette.success[400]} />
                <Text style={styles.scanAreaText}>Cheeks</Text>
              </View>
              <View style={styles.scanArea}>
                <Ionicons name="ellipse" size={8} color={palette.success[400]} />
                <Text style={styles.scanAreaText}>Nose</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.stepTitle}>
            {isCapturing ? 'Scanning...' : 'Face the Camera'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isCapturing
              ? 'Hold still while AI analyzes your skin'
              : 'Position your face in good lighting'}
          </Text>

          {/* Lighting Tips */}
          {!isCapturing && (
            <View style={styles.tipsRow}>
              <View style={styles.tipBadge}>
                <Ionicons name="sunny" size={16} color={palette.warning[500]} />
                <Text style={styles.tipBadgeText}>Good lighting</Text>
              </View>
              <View style={styles.tipBadge}>
                <Ionicons name="water" size={16} color={palette.info[500]} />
                <Text style={styles.tipBadgeText}>No makeup</Text>
              </View>
            </View>
          )}

          {!isCapturing && (
            <Button
              title="Start Skin Scan"
              icon="scan"
              size="lg"
              fullWidth
              onPress={startCapture}
              style={{ marginTop: spacing.md, backgroundColor: palette.success[500] }}
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
  faceFrame: {
    width: 260,
    height: 340,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceFrameActive: {
    borderColor: palette.success[400],
    borderStyle: 'solid',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: palette.success[400],
    shadowColor: palette.success[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: palette.success[400],
  },
  cornerTL: {
    top: 15,
    left: 25,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 15,
    right: 25,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 15,
    left: 25,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 15,
    right: 25,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  countdownContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: typography.weight.bold,
    color: palette.white,
  },
  scanAreasContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: spacing.md,
  },
  scanArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  scanAreaText: {
    fontSize: typography.size.xs,
    color: palette.white,
    fontWeight: typography.weight.medium,
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
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  tipBadgeText: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
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
    backgroundColor: palette.success[100],
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
