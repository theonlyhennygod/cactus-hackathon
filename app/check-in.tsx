import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { useVitalsStore } from '@/store';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route: string;
  delay: number;
  isCompleted?: boolean;
}

function FeatureCard({ title, description, icon, color, bgColor, route, delay, isCompleted }: FeatureCardProps) {
  const router = useRouter();
  
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500).springify()}>
      <Pressable
        style={({ pressed }) => [
          styles.featureCard,
          pressed && styles.featureCardPressed,
          isCompleted && styles.featureCardCompleted,
        ]}
        onPress={() => router.push(route as any)}
      >
        <LinearGradient
          colors={[bgColor, bgColor + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureGradient}
        >
          <View style={styles.featureContent}>
            <View style={[styles.featureIconContainer, { backgroundColor: color + '30' }]}>
              <Ionicons name={icon} size={32} color={color} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>{description}</Text>
            </View>
            <View style={styles.featureArrow}>
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={28} color={palette.success[500]} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={color} />
              )}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function CheckInScreen() {
  const router = useRouter();
  const vitals = useVitalsStore();
  
  // Check which features have been completed
  const hasMoodCheck = vitals.moodScore !== null;
  const hasBreathing = vitals.breathingRate !== null;
  const hasTremor = vitals.tremorIndex !== null;
  const hasSkinAnalysis = vitals.skinCondition !== null && vitals.skinCondition !== undefined;
  
  const completedCount = [hasMoodCheck, hasBreathing, hasTremor, hasSkinAnalysis].filter(Boolean).length;
  
  const features: FeatureCardProps[] = [
    {
      title: 'Mood Check',
      description: 'Face + voice emotion analysis',
      icon: 'happy',
      color: palette.primary[500],
      bgColor: palette.primary[50],
      route: '/features/heart-scan',
      delay: 100,
      isCompleted: hasMoodCheck,
    },
    {
      title: 'Lung Sound Analysis',
      description: 'Record breathing for respiratory check',
      icon: 'mic',
      color: palette.warning[500],
      bgColor: palette.warning[50],
      route: '/features/lung-sound',
      delay: 200,
      isCompleted: hasBreathing,
    },
    {
      title: 'Tremor Assessment',
      description: 'Test hand stability with sensors',
      icon: 'hand-left',
      color: palette.success[500],
      bgColor: palette.success[50],
      route: '/features/tremor-test',
      delay: 300,
      isCompleted: hasTremor,
    },
    {
      title: 'Skin & Face Analysis',
      description: 'AI vision check for skin health',
      icon: 'scan',
      color: palette.danger[500],
      bgColor: palette.danger[50],
      route: '/features/skin-scan',
      delay: 400,
      isCompleted: hasSkinAnalysis,
    },
  ];

  const handleViewResults = () => {
    router.push('/results');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="chevron-down" size={28} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Health Check-In</Text>
          <Text style={styles.subtitle}>
            Select any feature to start analysis
          </Text>
        </View>
      </Animated.View>

      {/* Progress indicator */}
      {completedCount > 0 && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedCount / 4) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/4 checks completed</Text>
        </Animated.View>
      )}

      {/* Features List */}
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </View>

        {/* View Results Button - only show if at least one check is done */}
        {completedCount > 0 && (
          <Animated.View entering={FadeInUp.delay(500).duration(500).springify()}>
            <Pressable
              style={({ pressed }) => [
                styles.resultsButton,
                pressed && styles.resultsButtonPressed,
              ]}
              onPress={handleViewResults}
            >
              <LinearGradient
                colors={[palette.primary[500], palette.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultsGradient}
              >
                <Ionicons name="analytics" size={24} color={palette.white} />
                <Text style={styles.resultsButtonText}>View Results</Text>
                <Ionicons name="arrow-forward" size={20} color={palette.white} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Info card */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={20} color={palette.primary[500]} />
          </View>
          <Text style={styles.infoText}>
            Each test runs independently. Complete as many as you'd like for a comprehensive wellness check.
          </Text>
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
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    marginTop: spacing.xs,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.success[500],
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  featuresContainer: {
    gap: spacing.md,
  },
  featureCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  featureCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  featureCardCompleted: {
    opacity: 0.85,
  },
  featureGradient: {
    padding: spacing.lg,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  featureDescription: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    marginTop: spacing.xxs,
  },
  featureArrow: {
    marginLeft: spacing.sm,
  },
  resultsButton: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  resultsButtonPressed: {
    opacity: 0.9,
  },
  resultsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resultsButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: palette.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: palette.primary[50],
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: palette.primary[700],
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
});
