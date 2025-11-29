import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, palette, radius, spacing, typography } from '@/constants/theme';

interface AIStatusBadgeProps {
  inferenceType: 'local' | 'cloud' | 'fallback';
  compact?: boolean;
}

export function AIStatusBadge({ inferenceType, compact = false }: AIStatusBadgeProps) {
  const config = {
    local: {
      icon: 'hardware-chip' as const,
      label: 'On-Device AI',
      color: palette.success[500],
      bgColor: palette.success[50],
    },
    cloud: {
      icon: 'cloud' as const,
      label: 'Cloud AI',
      color: palette.primary[500],
      bgColor: palette.primary[50],
    },
    fallback: {
      icon: 'analytics' as const,
      label: 'Smart Analysis',
      color: palette.warning[500],
      bgColor: palette.warning[50],
    },
  };

  const { icon, label, color, bgColor } = config[inferenceType];

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  compactBadge: {
    padding: spacing.xs,
    borderRadius: radius.full,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
});
