import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { generateTriage, type TriageResult } from '@/agents';
import { AIStatusBadge } from '@/components/ui/AIStatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
// import { OfflineIndicator } from '@/components/ui/OfflineIndicator'; // Disabled for Expo Go
import { VitalCard } from '@/components/ui/VitalCard';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useCheckInStore, useVitalsStore } from '@/store';
import { generateAndSharePDF } from '@/utils/pdfExport';

type VitalStatus = 'excellent' | 'good' | 'normal' | 'caution' | 'concern';
type EmotionType = 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'calm';

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

function getBreathingStatus(br: number): VitalStatus {
  if (br >= 12 && br <= 16) return 'excellent';
  if (br >= 10 && br <= 18) return 'good';
  if (br >= 8 && br <= 20) return 'normal';
  return 'caution';
}

function getTremorStatus(ti: number): VitalStatus {
  if (ti < 0.5) return 'excellent';
  if (ti < 1.0) return 'good';
  if (ti < 1.5) return 'normal';
  if (ti < 2.0) return 'caution';
  return 'concern';
}

export default function ResultsScreen() {
  const router = useRouter();
  const vitals = useVitalsStore();
  const vitalsReset = useVitalsStore((state) => state.reset);
  const { reset: checkInReset } = useCheckInStore();
  const [aiAnalysis, setAiAnalysis] = useState<TriageResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  // Load AI analysis and trend insights on mount
  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoadingAI(true);
      
      // Generate AI recommendations using Qwen (local-first)
      try {
        console.log('🧠 Generating AI recommendations...');
        const triageResult = await generateTriage(
          {
            moodScore: vitals.moodScore,
            overallMood: vitals.overallMood,
            facialEmotion: vitals.facialEmotion,
            voiceEmotion: vitals.voiceEmotion,
            tremorIndex: vitals.tremorIndex,
            breathingRate: vitals.breathingRate,
            skinCondition: vitals.skinCondition,
          },
          { skinCondition: vitals.skinCondition },
          { 
            breathingRate: vitals.breathingRate,
            coughType: vitals.coughType,
          }
        );
        setAiAnalysis(triageResult);
        
        // Also update the store with AI results
        vitals.setVitals({
          summary: triageResult.summary,
          severity: triageResult.severity,
          recommendations: triageResult.recommendations,
          inferenceType: triageResult.inferenceType,
        });
        
        console.log('✅ AI analysis complete:', triageResult.inferenceType);
      } catch (error) {
        console.error('AI analysis error:', error);
      }
      
      setIsLoadingAI(false);
    };
    
    loadAnalysis();
  }, [vitals.moodScore, vitals.breathingRate, vitals.tremorIndex, vitals.skinCondition]);

  const handleDone = () => {
    // Reset both stores completely
    vitalsReset();
    checkInReset();
    router.replace('/');
  };

  const handleExport = async () => {
    await generateAndSharePDF(vitals);
  };

  // Calculate overall status based on mood and vitals
  const getOverallStatus = () => {
    // Use mood score as primary indicator
    if (vitals.moodScore !== null) {
      if (vitals.moodScore >= 70) return { status: 'great', message: 'You seem to be doing great!', color: palette.success[500] };
      if (vitals.moodScore >= 50) return { status: 'normal', message: 'Your wellness looks balanced', color: palette.primary[500] };
      if (vitals.moodScore >= 30) return { status: 'caution', message: 'Consider some self-care today', color: palette.warning[500] };
      return { status: 'concern', message: 'Take care of yourself', color: palette.danger[500] };
    }
    
    // Fallback to vitals check
    const statuses = [
      vitals.breathingRate !== null ? getBreathingStatus(vitals.breathingRate) : 'normal',
      vitals.tremorIndex !== null ? getTremorStatus(vitals.tremorIndex) : 'normal',
    ];
    
    if (statuses.includes('concern')) return { status: 'concern', message: 'Consider consulting a healthcare provider', color: palette.danger[500] };
    if (statuses.includes('caution')) return { status: 'caution', message: 'Some metrics need attention', color: palette.warning[500] };
    if (statuses.every(s => s === 'excellent' || s === 'good')) return { status: 'great', message: 'Your vitals look great!', color: palette.success[500] };
    return { status: 'normal', message: 'Wellness check complete', color: palette.primary[500] };
  };

  const overall = getOverallStatus();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <LinearGradient
            colors={[overall.color, overall.color + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerIconContainer}>
              <Ionicons 
                name={overall.status === 'concern' ? 'alert-circle' : overall.status === 'caution' ? 'warning' : 'checkmark-circle'} 
                size={40} 
                color={palette.white} 
              />
            </View>
            <Text style={styles.headerTitle}>Wellness Check Complete</Text>
            <Text style={styles.headerMessage}>{overall.message}</Text>
            
            <View style={styles.timestampContainer}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.timestamp}>
                {new Date().toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Offline Indicator - Disabled for Expo Go */}
        {/* <OfflineIndicator /> */}

        {/* Vitals Grid - Breathing & Tremor */}
        <Text style={styles.sectionTitle}>Your Vitals</Text>
        
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalColumn}>
            <VitalCard
              title="Breathing Rate"
              value={vitals.breathingRate !== null ? vitals.breathingRate.toFixed(0) : '--'}
              unit="rpm"
              icon="fitness"
              status={vitals.breathingRate !== null ? getBreathingStatus(vitals.breathingRate) : 'normal'}
              subtitle="Breaths per minute"
              animationDelay={100}
            />
          </View>
          <View style={styles.vitalColumn}>
            <VitalCard
              title="Tremor Index"
              value={vitals.tremorIndex !== null ? vitals.tremorIndex.toFixed(2) : '--'}
              unit=""
              icon="hand-left"
              status={vitals.tremorIndex !== null ? getTremorStatus(vitals.tremorIndex) : 'normal'}
              subtitle="Hand stability score"
              animationDelay={200}
            />
          </View>
        </View>

        {/* AI Triage Summary */}
        <Animated.View entering={FadeInUp.delay(500).duration(500).springify()}>
          <Card variant="outlined" padding="lg" style={styles.triageCard}>
            <View style={styles.triageHeader}>
              <View style={[
                styles.triageIconContainer,
                aiAnalysis?.severity === 'red' && { backgroundColor: palette.danger[100] },
                aiAnalysis?.severity === 'yellow' && { backgroundColor: palette.warning[100] },
              ]}>
                <Ionicons 
                  name="sparkles" 
                  size={20} 
                  color={
                    aiAnalysis?.severity === 'red' ? palette.danger[500] :
                    aiAnalysis?.severity === 'yellow' ? palette.warning[500] :
                    Colors.light.primary
                  } 
                />
              </View>
              <Text style={styles.triageTitle}>AI Health Analysis</Text>
              {!isLoadingAI && aiAnalysis && (
                <AIStatusBadge inferenceType={aiAnalysis.inferenceType || 'fallback'} />
              )}
            </View>
            
            {isLoadingAI ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.loadingText}>Analyzing your vitals with Qwen AI...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.triageText}>
                  {aiAnalysis?.summary || `Based on your vitals, everything looks ${overall.status === 'great' ? 'excellent' : 'stable'}. Consider staying hydrated and maintaining your current wellness routine.`}
                </Text>
                
                {/* AI Recommendations */}
                {aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <View style={styles.recommendationsList}>
                    <Text style={styles.recommendationsTitle}>Recommendations</Text>
                    {aiAnalysis.recommendations.map((rec: string, index: number) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Ionicons name="checkmark-circle" size={16} color={palette.success[500]} />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
            
            <View style={styles.triageFooter}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.light.textTertiary} />
              <Text style={styles.triageDisclaimer}>
                Non-diagnostic wellness insights • Powered by on-device AI
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Skin Condition Card - if available */}
        {vitals.skinCondition && (
          <Animated.View entering={FadeInUp.delay(550).duration(500).springify()}>
            <Card variant="filled" padding="md" style={styles.skinCard}>
              <View style={styles.skinHeader}>
                <View style={styles.skinIconContainer}>
                  <Ionicons name="scan" size={20} color={palette.primary[500]} />
                </View>
                <Text style={styles.skinTitle}>Skin Analysis</Text>
              </View>
              <Text style={styles.skinConditionText}>
                Condition: <Text style={styles.skinConditionValue}>{vitals.skinCondition}</Text>
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Mood Analysis Card - if available */}
        {vitals.moodScore !== null && vitals.overallMood && (
          <Animated.View entering={FadeInUp.delay(575).duration(500).springify()}>
            <Card variant="filled" padding="md" style={styles.moodCard}>
              <View style={styles.moodHeader}>
                <View style={[styles.moodIconContainer, { backgroundColor: EMOTION_COLORS[vitals.overallMood as EmotionType] + '20' }]}>
                  <Text style={styles.moodEmoji}>{EMOTION_EMOJIS[vitals.overallMood as EmotionType]}</Text>
                </View>
                <View style={styles.moodTitleContainer}>
                  <Text style={styles.moodTitle}>Mood Analysis</Text>
                  <Text style={[styles.moodLabel, { color: EMOTION_COLORS[vitals.overallMood as EmotionType] }]}>
                    {vitals.overallMood.charAt(0).toUpperCase() + vitals.overallMood.slice(1)}
                  </Text>
                </View>
                <View style={[styles.moodScoreBadge, { backgroundColor: EMOTION_COLORS[vitals.overallMood as EmotionType] }]}>
                  <Text style={styles.moodScoreText}>{vitals.moodScore}</Text>
                </View>
              </View>
              
              {vitals.moodDescription && (
                <Text style={styles.moodDescription}>{vitals.moodDescription}</Text>
              )}
              
              {(vitals.facialEmotion || vitals.voiceEmotion) && (
                <View style={styles.moodBreakdown}>
                  {vitals.facialEmotion && (
                    <View style={styles.moodBreakdownItem}>
                      <Text style={styles.moodBreakdownLabel}>👤 Face:</Text>
                      <Text style={styles.moodBreakdownValue}>
                        {EMOTION_EMOJIS[vitals.facialEmotion as EmotionType]} {vitals.facialEmotion}
                      </Text>
                    </View>
                  )}
                  {vitals.voiceEmotion && (
                    <View style={styles.moodBreakdownItem}>
                      <Text style={styles.moodBreakdownLabel}>🎤 Voice:</Text>
                      <Text style={styles.moodBreakdownValue}>
                        {EMOTION_EMOJIS[vitals.voiceEmotion as EmotionType]} {vitals.voiceEmotion}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(500).springify()}
          style={styles.actions}
        >
          <Button
            title="Export PDF Summary"
            icon="document-text-outline"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleExport}
            style={{ marginBottom: spacing.sm }}
          />
          <Button
            title="Start New Check-In"
            icon="refresh-outline"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleDone}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  headerMessage: {
    fontSize: typography.size.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  timestamp: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  vitalsGrid: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  vitalColumn: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  triageCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  triageIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  triageTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  triageText: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
  },
  recommendationsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: Colors.light.text,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  triageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  triageDisclaimer: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    marginLeft: spacing.xs,
  },
  actions: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  recommendationsTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
    marginBottom: spacing.xs,
  },
  skinCard: {
    marginBottom: spacing.lg,
  },
  skinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skinIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: palette.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  skinTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  skinConditionText: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
  },
  skinConditionValue: {
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  // Mood Card Styles
  moodCard: {
    marginBottom: spacing.lg,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  moodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodTitleContainer: {
    flex: 1,
  },
  moodTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  moodLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textTransform: 'capitalize',
  },
  moodScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodScoreText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: palette.white,
  },
  moodDescription: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  moodBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  moodBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moodBreakdownLabel: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
  },
  moodBreakdownValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
});
