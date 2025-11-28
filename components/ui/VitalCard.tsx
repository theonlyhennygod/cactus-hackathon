import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Colors, radius, shadows, spacing, typography, vitalStatus } from '@/constants/theme';

type VitalStatusType = 'excellent' | 'good' | 'normal' | 'caution' | 'concern';

interface VitalCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  status?: VitalStatusType;
  subtitle?: string;
  animationDelay?: number;
}

export function VitalCard({
  title,
  value,
  unit,
  icon,
  status = 'normal',
  subtitle,
  animationDelay = 0,
}: VitalCardProps) {
  const colors = Colors.light;
  const statusColor = vitalStatus[status];

  const getStatusBadge = () => {
    const labels: Record<VitalStatusType, string> = {
      excellent: 'Excellent',
      good: 'Good',
      normal: 'Normal',
      caution: 'Monitor',
      concern: 'Attention',
    };

    return (
      <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
        <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.badgeText, { color: statusColor }]}>
          {labels[status]}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(animationDelay).duration(500).springify()}
      style={[styles.container, shadows.md]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: statusColor + '15' }]}>
          <Ionicons name={icon} size={24} color={statusColor} />
        </View>
        {getStatusBadge()}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: statusColor }]}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  content: {
    marginTop: spacing.xs,
  },
  title: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
  },
  unit: {
    fontSize: typography.size.md,
    color: Colors.light.textTertiary,
    marginLeft: spacing.xs,
    fontWeight: typography.weight.medium,
  },
  subtitle: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    marginTop: spacing.xs,
  },
});
