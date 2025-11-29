import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

import { Colors, palette, radius, spacing, typography } from '@/constants/theme';
import { modelManager } from '@/utils/modelManager';

interface ModelDownloadProgressProps {
  compact?: boolean;
}

/**
 * Shows download progress for AI models
 */
export function ModelDownloadProgress({ compact = false }: ModelDownloadProgressProps) {
  const [status, setStatus] = useState(modelManager.getAllStatus());
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = modelManager.subscribe(() => {
      setStatus(modelManager.getAllStatus());
    });
    return unsubscribe;
  }, []);

  // Find any downloading model
  const downloadingModel = Object.entries(status).find(
    ([, s]) => s.isDownloading
  );

  useEffect(() => {
    if (downloadingModel) {
      progressWidth.value = withTiming(downloadingModel[1].progress * 100, { duration: 200 });
    }
  }, [downloadingModel, progressWidth]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!downloadingModel) {
    // Show ready status if models are loaded
    const loadedCount = Object.values(status).filter(s => s.isReady).length;
    if (loadedCount > 0 && compact) {
      return (
        <View style={styles.readyBadge}>
          <Ionicons name="checkmark-circle" size={14} color={palette.success[500]} />
          <Text style={styles.readyText}>{loadedCount} AI Models Ready</Text>
        </View>
      );
    }
    return null;
  }

  const [modelName, modelStatus] = downloadingModel;
  const progressPercent = Math.round(modelStatus.progress * 100);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="cloud-download" size={14} color={Colors.light.primary} />
        <Text style={styles.compactText}>
          Downloading {modelName}... {progressPercent}%
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-download" size={20} color={Colors.light.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Downloading AI Model</Text>
          <Text style={styles.subtitle}>{modelName} • {progressPercent}%</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
      </View>
      <Text style={styles.hint}>Models are cached for offline use</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: Colors.light.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: radius.full,
  },
  hint: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: palette.primary[50],
    borderRadius: radius.full,
  },
  compactText: {
    fontSize: typography.size.xs,
    color: Colors.light.primary,
    fontWeight: typography.weight.medium,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: palette.success[50],
    borderRadius: radius.full,
  },
  readyText: {
    fontSize: typography.size.xs,
    color: palette.success[600],
    fontWeight: typography.weight.medium,
  },
});
