import { mmkvStorage } from '@/store/mmkv';

const BACKGROUND_FETCH_TASK = 'background-wellness-check';

// Register the background fetch task
export async function registerBackgroundFetchAsync(): Promise<void> {
  try {
    // Dynamic import to avoid crash in Expo Go
    const BackgroundFetch = await import('expo-background-fetch');
    const TaskManager = await import('expo-task-manager');
    
    // Define the task
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        console.log('📊 Background task running...');
        const now = Date.now();
        
        const activityData = {
          lastCheck: now,
        };
        
        mmkvStorage.setItem('last_background_check', JSON.stringify(activityData));
        console.log('✅ Background check completed at:', new Date(now).toISOString());
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('❌ Background task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('✅ Background fetch registered');
  } catch (err) {
    console.log('⚠️ Background fetch not available (Expo Go):', err);
  }
}

// Unregister the background fetch task
export async function unregisterBackgroundFetchAsync(): Promise<void> {
  try {
    const BackgroundFetch = await import('expo-background-fetch');
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('🛑 Background fetch unregistered');
  } catch (err) {
    console.log('⚠️ Background fetch unregistration failed:', err);
  }
}

// Get last background check time
export function getLastBackgroundCheck(): { lastCheck: number } | null {
  try {
    const data = mmkvStorage.getItem('last_background_check');
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}