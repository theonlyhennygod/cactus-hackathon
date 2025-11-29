import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { mmkvStorage } from '@/store/mmkv';

const BACKGROUND_FETCH_TASK = 'background-wellness-check';

// Define what happens when the background task runs
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('📊 Background task running...');
    
    // Get current timestamp
    const now = Date.now();
    
    // Store last activity check timestamp
    const activityData = {
      lastCheck: now,
      // In a real app, you'd collect sensor data here
      // For now, we just log the check
    };
    
    mmkvStorage.setItem('last_background_check', JSON.stringify(activityData));
    console.log('✅ Background check completed at:', new Date(now).toISOString());
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background fetch task
export async function registerBackgroundFetchAsync(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('✅ Background fetch registered');
  } catch (err) {
    console.log('⚠️ Background fetch registration failed:', err);
  }
}

// Unregister the background fetch task
export async function unregisterBackgroundFetchAsync(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('🛑 Background fetch unregistered');
  } catch (err) {
    console.log('⚠️ Background fetch unregistration failed:', err);
  }
}

// Check if background fetch is registered
export async function checkBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    console.log('📋 Background fetch status:', status);
    return status;
  } catch {
    return null;
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
