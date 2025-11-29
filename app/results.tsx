import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTrendInsights, type TrendInsight } from '@/agents/MemoryAgent';
import { AIStatusBadge } from '@/components/ui/AIStatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
// import { OfflineIndicator } from '@/components/ui/OfflineIndicator'; // Disabled for Expo Go
import { VitalCard } from '@/components/ui/VitalCard';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useCheckInStore, useVitalsStore } from '@/store';
import { generateAndSharePDF } from '@/utils/pdfExport';

type VitalStatus = 'excellent' | 'good' | 'normal' | 'caution' | 'concern';

function getHeartRateStatus(hr: number): VitalStatus {
  if (hr >= 60 && hr <= 70) return 'excellent';
  if (hr >= 55 && hr <= 80) return 'good';
  if (hr >= 50 && hr <= 100) return 'normal';
  if (hr >= 45 && hr <= 110) return 'caution';
  return 'concern';
}

function getHRVStatus(hrv: number): VitalStatus {
  if (hrv >= 60) return 'excellent';
  if (hrv >= 45) return 'good';
  if (hrv >= 30) return 'normal';
  if (hrv >= 20) return 'caution';
  return 'concern';
}

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
  const { reset } = useCheckInStore();
  const [trendInsights, setTrendInsights] = useState<TrendInsight[]>([]);

  // Load trend insights on mount
  useEffect(() => {
    const loadInsights = async () => {
      const insights = await getTrendInsights({
        heartRate: vitals.heartRate ?? undefined,
        hrv: vitals.hrv ?? undefined,
        breathingRate: vitals.breathingRate ?? undefined,
        tremorIndex: vitals.tremorIndex ?? undefined,
        coughType: vitals.coughType ?? undefined,
      });
      setTrendInsights(insights);
    };
    loadInsights();
  }, [vitals]);

  const handleDone = () => {
    reset();
    router.replace('/');
  };

  const handleExport = async () => {
    await generateAndSharePDF(vitals);
  };

  // Calculate overall status
  const getOverallStatus = () => {
    const statuses = [
      vitals.heartRate !== null ? getHeartRateStatus(vitals.heartRate) : 'normal',
      vitals.hrv !== null ? getHRVStatus(vitals.hrv) : 'normal',
      vitals.breathingRate !== null ? getBreathingStatus(vitals.breathingRate) : 'normal',
      vitals.tremorIndex !== null ? getTremorStatus(vitals.tremorIndex) : 'normal',
    ];
    
    if (statuses.includes('concern')) return { status: 'concern', message: 'Consider consulting a healthcare provider', color: palette.danger[500] };
    if (statuses.includes('caution')) return { status: 'caution', message: 'Some metrics need attention', color: palette.warning[500] };
    if (statuses.every(s => s === 'excellent' || s === 'good')) return { status: 'great', message: 'Your vitals look great!', color: palette.success[500] };
    return { status: 'normal', message: 'Your vitals are within normal range', color: palette.primary[500] };
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

        {/* Vitals Grid */}
        <Text style={styles.sectionTitle}>Your Vitals</Text>
        
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalColumn}>
            <VitalCard
              title="Heart Rate"
              value={vitals.heartRate !== null ? vitals.heartRate.toFixed(0) : '--'}
              unit="bpm"
              icon="heart"
              status={vitals.heartRate !== null ? getHeartRateStatus(vitals.heartRate) : 'normal'}
              subtitle="Resting heart rate"
              animationDelay={100}
            />
            <VitalCard
              title="Breathing Rate"
              value={vitals.breathingRate !== null ? vitals.breathingRate.toFixed(0) : '--'}
              unit="rpm"
              icon="fitness"
              status={vitals.breathingRate !== null ? getBreathingStatus(vitals.breathingRate) : 'normal'}
              subtitle="Breaths per minute"
              animationDelay={300}
            />
          </View>
          <View style={styles.vitalColumn}>
            <VitalCard
              title="HRV"
              value={vitals.hrv !== null ? vitals.hrv.toFixed(0) : '--'}
              unit="ms"
              icon="pulse"
              status={vitals.hrv !== null ? getHRVStatus(vitals.hrv) : 'normal'}
              subtitle="Heart rate variability"
              animationDelay={200}
            />
            <VitalCard
              title="Tremor Index"
              value={vitals.tremorIndex !== null ? vitals.tremorIndex.toFixed(2) : '--'}
              unit=""
              icon="hand-left"
              status={vitals.tremorIndex !== null ? getTremorStatus(vitals.tremorIndex) : 'normal'}
              subtitle="Hand stability score"
              animationDelay={400}
            />
          </View>
        </View>

        {/* AI Triage Summary */}
        <Animated.View entering={FadeInUp.delay(500).duration(500).springify()}>
          <Card variant="outlined" padding="lg" style={styles.triageCard}>
            <View style={styles.triageHeader}>
              <View style={[
                styles.triageIconContainer,
                vitals.severity === 'red' && { backgroundColor: palette.danger[100] },
                vitals.severity === 'yellow' && { backgroundColor: palette.warning[100] },
              ]}>
                <Ionicons 
                  name="sparkles" 
                  size={20} 
                  color={
                    vitals.severity === 'red' ? palette.danger[500] :
                    vitals.severity === 'yellow' ? palette.warning[500] :
                    Colors.light.primary
                  } 
                />
              </View>
              <Text style={styles.triageTitle}>AI Health Summary</Text>
              <AIStatusBadge inferenceType={vitals.inferenceType || 'fallback'} />
            </View>
            <Text style={styles.triageText}>
              {vitals.summary || `Based on your vitals, everything looks ${overall.status === 'great' ? 'excellent' : 'stable'}. Consider staying hydrated and maintaining your current wellness routine.`}
            </Text>
            
            {/* AI Recommendations */}
            {vitals.recommendations && vitals.recommendations.length > 0 && (
              <View style={styles.recommendationsList}>
                {vitals.recommendations.map((rec: string, index: number) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color={palette.success[500]} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.triageFooter}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.light.textTertiary} />
              <Text style={styles.triageDisclaimer}>
                Non-diagnostic wellness insights only
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Trend Insights - Memory Track Feature */}
        {trendInsights.length > 0 && (
          <Animated.View entering={FadeInUp.delay(600).duration(500).springify()}>
            <Card variant="filled" padding="md" style={styles.trendsCard}>
              <View style={styles.trendsHeader}>
                <View style={styles.trendsIconContainer}>
                  <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
                </View>
                <Text style={styles.trendsTitle}>Your Trends</Text>
              </View>
              <View style={styles.trendsList}>
                {trendInsights.map((insight, index) => (
                  <View key={index} style={styles.trendItem}>
                    <Ionicons 
                      name={insight.isPositive ? 'arrow-up-circle' : 'arrow-down-circle'} 
                      size={18} 
                      color={insight.isPositive ? palette.success[500] : palette.warning[500]} 
                    />
                    <View style={styles.trendContent}>
                      <Text style={styles.trendMetric}>{insight.metric}</Text>
                      <Text style={styles.trendMessage}>{insight.message}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(700).duration(500).springify()}
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
  trendsCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  trendsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  trendsList: {
    gap: spacing.sm,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  trendContent: {
    flex: 1,
  },
  trendMetric: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: Colors.light.text,
  },
  trendMessage: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
});
