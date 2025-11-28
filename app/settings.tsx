import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, palette, radius, spacing, typography } from '@/constants/theme';
import { useSettingsStore } from '@/store';
import { mmkvStorage } from '@/store/mmkv';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ icon, iconColor, iconBg, title, subtitle, right, onPress }: SettingRowProps) {
  const content = (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg || Colors.light.primaryLight }]}>
        <Ionicons name={icon} size={20} color={iconColor || Colors.light.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your wellness history and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            mmkvStorage.removeItem('wellness_history');
            Alert.alert('Data Deleted', 'All local wellness history has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </Animated.View>

        {/* Privacy Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <SettingRow
              icon="shield-checkmark"
              iconColor={palette.success[600]}
              iconBg={palette.success[100]}
              title="Privacy Mode"
              subtitle="All data stays on device"
              right={
                <Switch
                  value={isPrivacyMode}
                  onValueChange={togglePrivacyMode}
                  trackColor={{ false: palette.neutral[200], true: palette.primary[400] }}
                  thumbColor={isPrivacyMode ? palette.primary[600] : palette.neutral[100]}
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock-closed"
              iconColor={palette.primary[600]}
              iconBg={palette.primary[100]}
              title="Data Encryption"
              subtitle="MMKV encrypted storage"
              right={
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Active</Text>
                </View>
              }
            />
          </Card>
        </Animated.View>

        {/* Data Management Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <SettingRow
              icon="cloud-offline"
              title="Offline Mode"
              subtitle="No network requests"
              right={
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Always On</Text>
                </View>
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="document-text"
              title="Export Health Data"
              subtitle="Download your wellness history"
              right={<Ionicons name="chevron-forward" size={20} color={Colors.light.textTertiary} />}
              onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
            />
          </Card>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Card variant="outlined" padding="md" style={{ ...styles.card, ...styles.dangerCard }}>
            <View style={styles.dangerContent}>
              <View style={styles.dangerIcon}>
                <Ionicons name="warning" size={24} color={palette.danger[500]} />
              </View>
              <View style={styles.dangerText}>
                <Text style={styles.dangerTitle}>Delete All Data</Text>
                <Text style={styles.dangerSubtitle}>
                  Permanently remove all wellness history and settings
                </Text>
              </View>
            </View>
            <Button
              title="Delete All Data"
              icon="trash-outline"
              variant="danger"
              fullWidth
              onPress={handleDeleteData}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <SettingRow
              icon="information-circle"
              title="Version"
              right={<Text style={styles.versionText}>1.0.0 (Hackathon)</Text>}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="hardware-chip"
              title="Powered By"
              right={<Text style={styles.versionText}>Echo-LNN & Cactus</Text>}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="logo-github"
              title="Source Code"
              right={<Ionicons name="chevron-forward" size={20} color={Colors.light.textTertiary} />}
              onPress={() => Alert.alert('Open Source', 'Built with love for the hackathon!')}
            />
          </Card>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="medical" size={24} color={Colors.light.primary} />
          </View>
          <Text style={styles.footerTitle}>Pocket Doctor</Text>
          <Text style={styles.footerText}>
            Private, offline-first wellness triage
          </Text>
          <Text style={styles.disclaimer}>
            This app provides wellness insights only and is not intended for medical diagnosis.
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: Colors.light.text,
  },
  settingSubtitle: {
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: spacing.md + 40 + spacing.md,
  },
  badge: {
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: Colors.light.success,
  },
  versionText: {
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
  },
  dangerCard: {
    borderColor: palette.danger[200],
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: palette.danger[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dangerText: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: palette.danger[700],
  },
  dangerSubtitle: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: Colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  footerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  footerText: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  disclaimer: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    lineHeight: typography.size.xs * typography.lineHeight.relaxed,
  },
});
