import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import HealthTrends from '@/components/HealthTrends';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, palette, radius, shadows, spacing, typography } from '@/constants/theme';
import { registerBackgroundFetchAsync } from '@/utils/backgroundTasks';

export default function HomeScreen() {
  const router = useRouter();
  const colors = Colors.light;

  // Register background fetch on app launch
  useEffect(() => {
    registerBackgroundFetchAsync();
  }, []);

  const features = [
    { icon: 'heart-outline' as const, title: 'Heart Rate', desc: 'PPG Analysis' },
    { icon: 'pulse-outline' as const, title: 'HRV', desc: 'Variability' },
    { icon: 'fitness-outline' as const, title: 'Breathing', desc: 'Respiratory' },
    { icon: 'hand-left-outline' as const, title: 'Tremor', desc: 'Stability' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome to</Text>
              <Text style={styles.appName}>Pocket Doctor</Text>
            </View>
            <Button
              title=""
              icon="settings-outline"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
              style={styles.settingsButton}
            />
          </View>
          <Text style={styles.tagline}>
            Private, offline wellness checks powered by on-device AI
          </Text>
        </Animated.View>

        {/* Main CTA Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
          <LinearGradient
            colors={[palette.primary[500], palette.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaCard}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="medkit" size={32} color={palette.white} />
              </View>
              <Text style={styles.ctaTitle}>Quick Health Check</Text>
              <Text style={styles.ctaDescription}>
                Complete a 60-second wellness assessment using your camera, microphone, and sensors.
              </Text>
              <Button
                title="Start Check-In"
                icon="arrow-forward"
                iconPosition="right"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => router.push('/check-in')}
                style={styles.ctaButton}
              />
            </View>
            
            {/* Decorative elements */}
            <View style={styles.ctaDecor1} />
            <View style={styles.ctaDecor2} />
          </LinearGradient>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(600).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>What We Measure</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featuresRow}>
              {features.slice(0, 2).map((feature) => (
                <View key={feature.title} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon} size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              ))}
            </View>
            <View style={styles.featuresRow}>
              {features.slice(2, 4).map((feature) => (
                <View key={feature.title} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon} size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Health Trends */}
        <Animated.View entering={FadeInUp.delay(700).duration(600).springify()}>
          <Text style={styles.sectionTitle}>Your Trends</Text>
          <HealthTrends metric="heartRate" />
        </Animated.View>

        {/* Privacy Badge */}
        <Animated.View entering={FadeInUp.delay(900).duration(600).springify()}>
          <Card variant="filled" padding="md" style={styles.privacyCard}>
            <View style={styles.privacyContent}>
              <View style={styles.privacyIcon}>
                <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              </View>
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>100% Private & Offline</Text>
                <Text style={styles.privacyDesc}>
                  All processing happens on your device. No data is ever sent to the cloud.
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View 
          entering={FadeInUp.delay(1000).duration(600).springify()}
          style={styles.disclaimer}
        >
          <Text style={styles.disclaimerText}>
            Pocket Doctor provides wellness insights only. Not intended for medical diagnosis.
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
  },
  appName: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
    marginTop: spacing.xs,
  },
  settingsButton: {
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: typography.size.md,
    color: Colors.light.textSecondary,
    marginTop: spacing.sm,
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
  },
  ctaCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  ctaContent: {
    position: 'relative',
    zIndex: 1,
  },
  ctaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ctaTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: palette.white,
    marginBottom: spacing.sm,
  },
  ctaDescription: {
    fontSize: typography.size.md,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: palette.white,
  },
  ctaDecor1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ctaDecor2: {
    position: 'absolute',
    bottom: -20,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    gap: spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  privacyCard: {
    marginBottom: spacing.lg,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: Colors.light.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
    marginBottom: spacing.xs,
  },
  privacyDesc: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  disclaimer: {
    paddingHorizontal: spacing.md,
  },
  disclaimerText: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    lineHeight: typography.size.xs * typography.lineHeight.relaxed,
  },
});
