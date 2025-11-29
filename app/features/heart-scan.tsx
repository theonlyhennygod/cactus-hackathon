import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

import { analyzeEmotion, getRandomQuestion, type EmotionResult, type EmotionType } from '@/agents';
import { Button } from '@/components/ui/Button';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useVitalsStore } from '@/store';

type ScanStep = 'intro' | 'photo' | 'question' | 'voice' | 'processing' | 'result';

// Emoji mapping for emotions
const EMOTION_EMOJIS: Record<EmotionType, string> = {
  happy: '😊',
  calm: '😌',
  neutral: '😐',
  anxious: '😰',
  sad: '😢',
  angry: '😠',
};

const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: palette.success[500],
  calm: palette.primary[500],
  neutral: palette.neutral[500],
  anxious: palette.warning[500],
  sad: palette.info[500],
  angry: palette.danger[500],
};

export default function EmotionScanScreen() {
  const router = useRouter();
  const { setVitals } = useVitalsStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [audioPermission, setAudioPermission] = useState(false);
  const [step, setStep] = useState<ScanStep>('intro');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioUri = useRef<string | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const resultScale = useSharedValue(0);

  useEffect(() => {
    requestAudioPermission();
    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isRecording]);

  const requestAudioPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setAudioPermission(status === 'granted');
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      
      if (photo?.uri) {
        console.log('📸 Photo captured:', photo.uri);
        setCapturedPhoto(photo.uri);
        
        // Generate question for voice part
        setCurrentQuestion(getRandomQuestion());
        setStep('question');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRecordingTime(0);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/mp4',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      
      console.log('🎤 Voice recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      audioUri.current = uri || null;
      recordingRef.current = null;
      
      console.log('🎤 Voice recording saved:', uri);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
    
    setIsRecording(false);
  };

  const handleVoiceComplete = async () => {
    await stopRecording();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('processing');
    
    // Run emotion analysis
    try {
      console.log('🧠 Running emotion analysis...');
      const result = await analyzeEmotion(
        capturedPhoto || '',
        audioUri.current || ''
      );
      
      setEmotionResult(result);
      
      // Save to store
      setVitals({
        moodScore: result.moodScore,
        overallMood: result.overallMood,
        facialEmotion: result.facialEmotion,
        voiceEmotion: result.voiceEmotion,
        moodDescription: result.moodDescription,
      });
      
      // Animate result
      resultScale.value = withSpring(1, { damping: 10 });
      setStep('result');
      
    } catch (error) {
      console.error('Emotion analysis failed:', error);
      // Fallback result
      const fallbackResult: EmotionResult = {
        facialEmotion: 'neutral',
        facialConfidence: 0.5,
        voiceEmotion: 'neutral',
        voiceConfidence: 0.5,
        voiceTranscription: '',
        overallMood: 'neutral',
        moodScore: 50,
        moodDescription: 'Unable to fully analyze. Consider trying again.',
        inferenceType: 'fallback',
      };
      setEmotionResult(fallbackResult);
      setVitals({
        moodScore: 50,
        overallMood: 'neutral',
        facialEmotion: 'neutral',
        voiceEmotion: 'neutral',
        moodDescription: fallbackResult.moodDescription,
      });
      resultScale.value = withSpring(1);
      setStep('result');
    }
  };

  const handleClose = () => {
    stopRecording();
    router.back();
  };

  const handleDone = () => {
    router.back();
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  // Check permissions
  const hasAllPermissions = cameraPermission?.granted && audioPermission;

  if (!hasAllPermissions) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="happy-outline" size={64} color={palette.primary[500]} />
          </View>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            We need camera and microphone access to analyze your facial expression and voice.
          </Text>
          <View style={{ gap: spacing.md, width: '100%' }}>
            {!cameraPermission?.granted && (
              <Button
                title="Grant Camera Access"
                icon="camera-outline"
                onPress={requestCameraPermission}
                fullWidth
              />
            )}
            {!audioPermission && (
              <Button
                title="Grant Microphone Access"
                icon="mic-outline"
                onPress={requestAudioPermission}
                fullWidth
                variant="secondary"
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[palette.primary[500], palette.primary[600]]}
          style={styles.processingContainer}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.processingContent}>
            <View style={styles.processingIcon}>
              <Ionicons name="sparkles" size={48} color={palette.white} />
            </View>
            <Text style={styles.processingTitle}>Analyzing Your Mood</Text>
            <Text style={styles.processingSubtitle}>
              Processing facial expression & voice sentiment...
            </Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Result screen
  if (step === 'result' && emotionResult) {
    const moodColor = EMOTION_COLORS[emotionResult.overallMood];
    const moodEmoji = EMOTION_EMOJIS[emotionResult.overallMood];
    
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Your Mood Analysis</Text>
        </SafeAreaView>

        <View style={styles.resultContent}>
          <Animated.View style={[styles.resultCard, resultStyle]}>
            {/* Main Score */}
            <View style={[styles.moodCircle, { borderColor: moodColor }]}>
              <Text style={styles.moodEmoji}>{moodEmoji}</Text>
              <Text style={[styles.moodScore, { color: moodColor }]}>{emotionResult.moodScore}</Text>
              <Text style={styles.moodScoreLabel}>Mood Score</Text>
            </View>

            {/* Mood Label */}
            <Text style={[styles.moodLabel, { color: moodColor }]}>
              {emotionResult.overallMood.charAt(0).toUpperCase() + emotionResult.overallMood.slice(1)}
            </Text>

            {/* Description */}
            <Text style={styles.moodDescription}>{emotionResult.moodDescription}</Text>

            {/* Breakdown */}
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownIcon}>👤</Text>
                <Text style={styles.breakdownLabel}>Face</Text>
                <Text style={[styles.breakdownValue, { color: EMOTION_COLORS[emotionResult.facialEmotion] }]}>
                  {EMOTION_EMOJIS[emotionResult.facialEmotion]} {emotionResult.facialEmotion}
                </Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownIcon}>🎤</Text>
                <Text style={styles.breakdownLabel}>Voice</Text>
                <Text style={[styles.breakdownValue, { color: EMOTION_COLORS[emotionResult.voiceEmotion] }]}>
                  {EMOTION_EMOJIS[emotionResult.voiceEmotion]} {emotionResult.voiceEmotion}
                </Text>
              </View>
            </View>

            {/* Transcription if available */}
            {emotionResult.voiceTranscription && emotionResult.voiceTranscription.length > 0 && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionLabel}>What you said:</Text>
                <Text style={styles.transcriptionText}>"{emotionResult.voiceTranscription}"</Text>
              </View>
            )}

            {/* Inference type badge */}
            <View style={styles.inferenceBadge}>
              <Ionicons 
                name={emotionResult.inferenceType === 'local' ? 'phone-portrait' : 'cloud'} 
                size={14} 
                color={palette.neutral[500]} 
              />
              <Text style={styles.inferenceText}>
                {emotionResult.inferenceType === 'local' ? 'On-device AI' : 'Local Analysis'}
              </Text>
            </View>
          </Animated.View>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Button
            title="Done"
            icon="checkmark"
            size="lg"
            fullWidth
            onPress={handleDone}
          />
        </SafeAreaView>
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
        <Text style={styles.headerTitle}>Mood Check</Text>
      </SafeAreaView>

      {/* Intro Step */}
      {step === 'intro' && (
        <>
          <View style={styles.introContent}>
            <LinearGradient
              colors={[palette.primary[50], palette.primary[100]]}
              style={styles.introGradient}
            >
              <View style={styles.introIconContainer}>
                <Text style={styles.introEmoji}>😊</Text>
              </View>
              <Text style={styles.introTitle}>How are you feeling?</Text>
              <Text style={styles.introDescription}>
                We'll analyze your facial expression and voice to understand your emotional state.
              </Text>
              
              <View style={styles.stepsPreview}>
                <View style={styles.stepPreviewItem}>
                  <View style={[styles.stepPreviewIcon, { backgroundColor: palette.success[100] }]}>
                    <Ionicons name="camera" size={24} color={palette.success[600]} />
                  </View>
                  <Text style={styles.stepPreviewText}>Take a selfie</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={palette.neutral[400]} />
                <View style={styles.stepPreviewItem}>
                  <View style={[styles.stepPreviewIcon, { backgroundColor: palette.warning[100] }]}>
                    <Ionicons name="mic" size={24} color={palette.warning[600]} />
                  </View>
                  <Text style={styles.stepPreviewText}>Answer a question</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={palette.neutral[400]} />
                <View style={styles.stepPreviewItem}>
                  <View style={[styles.stepPreviewIcon, { backgroundColor: palette.primary[100] }]}>
                    <Ionicons name="sparkles" size={24} color={palette.primary[600]} />
                  </View>
                  <Text style={styles.stepPreviewText}>Get results</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Button
              title="Start Mood Check"
              icon="happy"
              size="lg"
              fullWidth
              onPress={() => setStep('photo')}
            />
          </SafeAreaView>
        </>
      )}

      {/* Photo Capture Step */}
      {step === 'photo' && (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.faceGuide} />
                <Text style={styles.cameraInstruction}>Position your face in the frame</Text>
              </View>
            </CameraView>
          </View>
          
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.stepTitle}>Step 1: Take a Selfie</Text>
              <Text style={styles.stepSubtitle}>Show your natural expression</Text>
              <Button
                title="Capture Photo"
                icon="camera"
                size="lg"
                fullWidth
                onPress={capturePhoto}
                style={{ marginTop: spacing.md }}
              />
            </Animated.View>
          </SafeAreaView>
        </>
      )}

      {/* Question Step */}
      {step === 'question' && (
        <>
          <View style={styles.questionContent}>
            {capturedPhoto && (
              <Image source={{ uri: capturedPhoto }} style={styles.capturedPhotoSmall} />
            )}
            <View style={styles.questionBox}>
              <Ionicons name="chatbubble-ellipses" size={32} color={palette.primary[500]} />
              <Text style={styles.questionText}>{currentQuestion}</Text>
            </View>
            <Text style={styles.questionHint}>
              Tap record and answer naturally. Speak for 5-10 seconds.
            </Text>
          </View>
          
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.stepTitle}>Step 2: Voice Response</Text>
              <Text style={styles.stepSubtitle}>Answer the question above</Text>
              <Button
                title="Start Recording"
                icon="mic"
                size="lg"
                fullWidth
                onPress={() => {
                  setStep('voice');
                  startRecording();
                }}
                style={{ marginTop: spacing.md }}
              />
            </Animated.View>
          </SafeAreaView>
        </>
      )}

      {/* Voice Recording Step */}
      {step === 'voice' && (
        <>
          <View style={styles.voiceContent}>
            <View style={styles.questionBoxSmall}>
              <Text style={styles.questionTextSmall}>{currentQuestion}</Text>
            </View>
            
            <Animated.View style={[styles.recordingIndicator, pulseStyle]}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>{recordingTime}s</Text>
            </Animated.View>
            
            <Text style={styles.recordingHint}>
              {isRecording ? 'Listening...' : 'Recording stopped'}
            </Text>
          </View>
          
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Button
                title={isRecording ? 'Stop & Analyze' : 'Analyzing...'}
                icon={isRecording ? 'stop' : 'sparkles'}
                size="lg"
                fullWidth
                onPress={handleVoiceComplete}
                style={{ 
                  marginTop: spacing.md,
                  backgroundColor: isRecording ? palette.danger[500] : palette.primary[500],
                }}
              />
            </Animated.View>
          </SafeAreaView>
        </>
      )}
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
  // Permission styles
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
    backgroundColor: palette.primary[100],
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
    paddingHorizontal: spacing.lg,
  },
  // Intro styles
  introContent: {
    flex: 1,
  },
  introGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  introIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  introEmoji: {
    fontSize: 64,
  },
  introTitle: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: palette.primary[700],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  introDescription: {
    fontSize: typography.size.md,
    color: palette.primary[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.size.md * 1.5,
  },
  stepsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stepPreviewItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepPreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPreviewText: {
    fontSize: typography.size.xs,
    color: palette.primary[700],
    fontWeight: typography.weight.medium,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: 200,
    height: 260,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  cameraInstruction: {
    marginTop: spacing.lg,
    fontSize: typography.size.md,
    color: palette.white,
    fontWeight: typography.weight.medium,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Question styles
  questionContent: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedPhotoSmall: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: palette.success[500],
  },
  questionBox: {
    backgroundColor: palette.primary[50],
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    maxWidth: 320,
    ...shadows.sm,
  },
  questionText: {
    marginTop: spacing.md,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: palette.primary[700],
    textAlign: 'center',
    lineHeight: typography.size.xl * 1.4,
  },
  questionHint: {
    marginTop: spacing.lg,
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  // Voice recording styles
  voiceContent: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionBoxSmall: {
    backgroundColor: palette.neutral[100],
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  questionTextSmall: {
    fontSize: typography.size.md,
    color: palette.neutral[700],
    textAlign: 'center',
  },
  recordingIndicator: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: palette.danger[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: palette.danger[500],
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.danger[500],
    marginBottom: spacing.sm,
  },
  recordingTime: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: palette.danger[600],
  },
  recordingHint: {
    marginTop: spacing.lg,
    fontSize: typography.size.lg,
    color: palette.danger[600],
    fontWeight: typography.weight.medium,
  },
  // Result styles
  resultContent: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  moodCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    marginBottom: spacing.lg,
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  moodScore: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
  },
  moodScoreLabel: {
    fontSize: typography.size.xs,
    color: Colors.light.textSecondary,
  },
  moodLabel: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  moodDescription: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: typography.size.md * 1.5,
    marginBottom: spacing.lg,
  },
  breakdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  breakdownLabel: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    marginBottom: spacing.xxs,
  },
  breakdownValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'capitalize',
  },
  breakdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.border,
    marginHorizontal: spacing.md,
  },
  transcriptionBox: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  inferenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: radius.full,
  },
  inferenceText: {
    fontSize: typography.size.xs,
    color: palette.neutral[500],
  },
  // Footer styles
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
  // Processing styles
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
