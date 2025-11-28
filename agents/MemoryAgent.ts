import { mmkvStorage } from '../store/mmkv';

const HISTORY_KEY = 'wellness_history';

export interface WellnessSession {
    timestamp: number;
    vitals: any;
    triage: any;
}

export const saveSession = async (session: WellnessSession) => {
    const historyStr = mmkvStorage.getItem(HISTORY_KEY);
    const history: WellnessSession[] = historyStr ? JSON.parse(historyStr as string) : [];

    history.push(session);
    // Keep last 50 sessions
    if (history.length > 50) history.shift();

    mmkvStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log('MemoryAgent: Session saved. Total history:', history.length);
};

export const getHistory = async (): Promise<WellnessSession[]> => {
    const historyStr = mmkvStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr as string) : [];
};

export const getBaseline = async (): Promise<any> => {
    const history = await getHistory();
    if (history.length === 0) return null;

    // Simple average of last 5 sessions
    const recent = history.slice(-5);
    const avgHR = recent.reduce((acc, s) => acc + (s.vitals.heartRate || 0), 0) / recent.length;

    return {
        baselineHeartRate: avgHR,
    };
};
