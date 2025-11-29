import { mmkvStorage } from '../store/mmkv';

const HISTORY_KEY = 'wellness_history';

export interface WellnessSession {
    timestamp: number;
    vitals: {
        heartRate?: number;
        hrv?: number;
        breathingRate?: number;
        tremorIndex?: number;
        coughType?: string;
        skinCondition?: string;
    };
    triage: {
        summary?: string;
        severity?: 'green' | 'yellow' | 'red';
        recommendations?: string[];
        inferenceType?: 'local' | 'cloud' | 'fallback';
    };
}

export interface BaselineData {
    heartRate: { avg: number; trend: 'up' | 'down' | 'stable'; change: number };
    hrv: { avg: number; trend: 'up' | 'down' | 'stable'; change: number };
    breathingRate: { avg: number; trend: 'up' | 'down' | 'stable'; change: number };
    tremorIndex: { avg: number; trend: 'up' | 'down' | 'stable'; change: number };
    sessionCount: number;
    lastSession: number | null;
}

export interface TrendInsight {
    metric: string;
    message: string;
    isPositive: boolean;
}

/**
 * Save a wellness session to local memory
 */
export const saveSession = async (session: WellnessSession): Promise<void> => {
    const historyStr = mmkvStorage.getItem(HISTORY_KEY);
    const history: WellnessSession[] = historyStr ? JSON.parse(historyStr as string) : [];

    history.push(session);
    // Keep last 50 sessions
    if (history.length > 50) history.shift();

    mmkvStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log('MemoryAgent: Session saved. Total history:', history.length);
};

/**
 * Get all session history
 */
export const getHistory = async (): Promise<WellnessSession[]> => {
    const historyStr = mmkvStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr as string) : [];
};

/**
 * Calculate baseline metrics with trends
 */
export const getBaseline = async (): Promise<BaselineData | null> => {
    const history = await getHistory();
    if (history.length === 0) return null;

    // Use last 7 sessions for baseline
    const recent = history.slice(-7);
    const older = history.slice(-14, -7);

    const calcMetric = (getValue: (s: WellnessSession) => number | undefined) => {
        const recentValues = recent.map(getValue).filter((v): v is number => v !== undefined);
        const olderValues = older.map(getValue).filter((v): v is number => v !== undefined);
        
        if (recentValues.length === 0) {
            return { avg: 0, trend: 'stable' as const, change: 0 };
        }
        
        const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const olderAvg = olderValues.length > 0 
            ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length 
            : recentAvg;
        
        const change = recentAvg - olderAvg;
        const percentChange = olderAvg !== 0 ? (change / olderAvg) * 100 : 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(percentChange) > 5) {
            trend = change > 0 ? 'up' : 'down';
        }
        
        return { avg: Math.round(recentAvg * 10) / 10, trend, change: Math.round(percentChange) };
    };

    return {
        heartRate: calcMetric(s => s.vitals.heartRate),
        hrv: calcMetric(s => s.vitals.hrv),
        breathingRate: calcMetric(s => s.vitals.breathingRate),
        tremorIndex: calcMetric(s => s.vitals.tremorIndex),
        sessionCount: history.length,
        lastSession: history[history.length - 1]?.timestamp || null,
    };
};

/**
 * Generate trend insights comparing current session to baseline
 */
export const getTrendInsights = async (currentVitals: WellnessSession['vitals']): Promise<TrendInsight[]> => {
    const baseline = await getBaseline();
    if (!baseline || baseline.sessionCount < 3) {
        return [{ 
            metric: 'sessions', 
            message: 'Complete more check-ins to see your health trends!', 
            isPositive: true 
        }];
    }

    const insights: TrendInsight[] = [];

    // Heart Rate insights
    if (currentVitals.heartRate && baseline.heartRate.avg > 0) {
        const diff = currentVitals.heartRate - baseline.heartRate.avg;
        const percentDiff = Math.abs((diff / baseline.heartRate.avg) * 100);
        
        if (percentDiff > 10) {
            insights.push({
                metric: 'Heart Rate',
                message: diff > 0 
                    ? `Your heart rate is ${Math.round(percentDiff)}% higher than your baseline`
                    : `Your heart rate is ${Math.round(percentDiff)}% lower than your baseline`,
                isPositive: Math.abs(currentVitals.heartRate - 70) < Math.abs(baseline.heartRate.avg - 70),
            });
        } else {
            insights.push({
                metric: 'Heart Rate',
                message: 'Your heart rate is consistent with your baseline',
                isPositive: true,
            });
        }
    }

    // HRV insights (higher is generally better)
    if (currentVitals.hrv && baseline.hrv.avg > 0) {
        const diff = currentVitals.hrv - baseline.hrv.avg;
        const percentDiff = Math.abs((diff / baseline.hrv.avg) * 100);
        
        if (percentDiff > 15) {
            insights.push({
                metric: 'HRV',
                message: diff > 0 
                    ? `Great! Your HRV improved ${Math.round(percentDiff)}% from baseline`
                    : `Your HRV is ${Math.round(percentDiff)}% below baseline - consider rest`,
                isPositive: diff > 0,
            });
        }
    }

    // Tremor insights (lower is better)
    if (currentVitals.tremorIndex !== undefined && baseline.tremorIndex.avg > 0) {
        const diff = currentVitals.tremorIndex - baseline.tremorIndex.avg;
        if (Math.abs(diff) > 0.5) {
            insights.push({
                metric: 'Stability',
                message: diff < 0 
                    ? 'Your hand stability has improved!'
                    : 'Higher tremor detected - ensure good rest',
                isPositive: diff < 0,
            });
        }
    }

    // Overall trend insight
    if (baseline.heartRate.trend !== 'stable' || baseline.hrv.trend !== 'stable') {
        const hrvTrending = baseline.hrv.trend === 'up';
        const hrStable = baseline.heartRate.trend === 'stable' || 
            (baseline.heartRate.trend === 'down' && baseline.heartRate.avg > 60);
        
        if (hrvTrending && hrStable) {
            insights.push({
                metric: 'Weekly Trend',
                message: 'Your overall wellness is trending positively this week!',
                isPositive: true,
            });
        }
    }

    return insights.length > 0 ? insights : [{
        metric: 'Status',
        message: 'Your vitals are stable and consistent',
        isPositive: true,
    }];
};

/**
 * Get a summary of wellness history for LLM context
 */
export const getHistorySummary = async (): Promise<string> => {
    const baseline = await getBaseline();
    if (!baseline) return 'No previous sessions recorded.';
    
    const parts: string[] = [];
    parts.push(`Sessions recorded: ${baseline.sessionCount}`);
    parts.push(`Avg HR: ${baseline.heartRate.avg} bpm (${baseline.heartRate.trend})`);
    parts.push(`Avg HRV: ${baseline.hrv.avg} ms (${baseline.hrv.trend})`);
    
    return parts.join('. ');
};
