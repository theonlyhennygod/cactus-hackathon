import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { getHistory } from '@/agents/MemoryAgent';
import { Card } from '@/components/ui/Card';
import { Colors, palette, radius, spacing, typography } from '@/constants/theme';

interface TrendData {
  x: number;
  y: number;
}

interface HealthTrendsProps {
  metric?: 'heartRate' | 'hrv' | 'tremor';
}

const CHART_WIDTH = Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2;

export default function HealthTrends({ metric = 'heartRate' }: HealthTrendsProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, min: 0, max: 0, trend: 'stable' as 'up' | 'down' | 'stable' });

  useEffect(() => {
    loadTrendData();
  }, [metric]);

  const loadTrendData = async () => {
    try {
      const history = await getHistory();
      
      if (history.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get last 7 data points
      const recentHistory = history.slice(-7);
      
      const chartData: TrendData[] = recentHistory.map((session, index) => {
        let value = 0;
        switch (metric) {
          case 'heartRate':
            value = session.vitals?.heartRate || 72;
            break;
          case 'hrv':
            value = session.vitals?.hrv || 50;
            break;
          case 'tremor':
            value = (session.vitals?.tremorIndex || 0) * 100; // Scale for visibility
            break;
        }
        return { x: index + 1, y: value };
      });

      setData(chartData);

      // Calculate stats
      const values = chartData.map(d => d.y);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (chartData.length >= 2) {
        const lastTwo = chartData.slice(-2);
        const diff = lastTwo[1].y - lastTwo[0].y;
        if (diff > avg * 0.05) trend = 'up';
        else if (diff < -avg * 0.05) trend = 'down';
      }

      setStats({ avg: Math.round(avg * 10) / 10, min, max, trend });
    } catch (error) {
      console.log('Error loading trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricConfig = () => {
    switch (metric) {
      case 'heartRate':
        return {
          title: 'Heart Rate Trend',
          unit: 'bpm',
          color: palette.danger[400],
          icon: 'heart' as const,
        };
      case 'hrv':
        return {
          title: 'HRV Trend',
          unit: 'ms',
          color: palette.primary[400],
          icon: 'pulse' as const,
        };
      case 'tremor':
        return {
          title: 'Stability Trend',
          unit: '',
          color: palette.success[400],
          icon: 'hand-left' as const,
        };
    }
  };

  const config = getMetricConfig();

  if (isLoading) {
    return (
      <Card variant="elevated" style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trends...</Text>
        </View>
      </Card>
    );
  }

  if (data.length < 2) {
    return (
      <Card variant="elevated" style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <Text style={styles.title}>{config.title}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyText}>
            Complete at least 2 check-ins to see trends
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="elevated" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>Last {data.length} sessions</Text>
        </View>
        <View style={styles.trendBadge}>
          <Ionicons 
            name={stats.trend === 'up' ? 'trending-up' : stats.trend === 'down' ? 'trending-down' : 'remove'} 
            size={16} 
            color={stats.trend === 'stable' ? Colors.light.textTertiary : config.color} 
          />
        </View>
      </View>

      {/* Simple Bar Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {data.map((point, index) => {
            const barHeight = ((point.y - stats.min) / (stats.max - stats.min || 1)) * 80 + 20;
            return (
              <View key={index} style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: barHeight, 
                      backgroundColor: config.color,
                      opacity: index === data.length - 1 ? 1 : 0.6,
                    }
                  ]} 
                />
                <Text style={styles.barLabel}>{index + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={styles.statValue}>{stats.avg} {config.unit}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{stats.min} {config.unit}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{stats.max} {config.unit}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.light.textTertiary,
    fontSize: typography.size.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
  },
  trendBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    paddingHorizontal: spacing.sm,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  barLabel: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: Colors.light.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
});
