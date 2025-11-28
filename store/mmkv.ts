import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// Synchronous wrapper for AsyncStorage to work with Zustand persist
class SyncStorage {
    private cache: Map<string, string> = new Map();
    private initialized: boolean = false;

    async init() {
        if (this.initialized) return;

        try {
            const keys = await AsyncStorage.getAllKeys();
            const entries = await AsyncStorage.multiGet(keys);
            entries.forEach(([key, value]) => {
                if (value) this.cache.set(key, value);
            });
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    getItem(name: string): string | null {
        return this.cache.get(name) ?? null;
    }

    setItem(name: string, value: string): void {
        this.cache.set(name, value);
        // Async write in background
        AsyncStorage.setItem(name, value).catch(error => {
            console.error('Failed to persist to AsyncStorage:', error);
        });
    }

    removeItem(name: string): void {
        this.cache.delete(name);
        AsyncStorage.removeItem(name).catch(error => {
            console.error('Failed to remove from AsyncStorage:', error);
        });
    }
}

const syncStorage = new SyncStorage();

// Initialize on module load
syncStorage.init();

export const mmkvStorage: StateStorage = {
    getItem: (name) => syncStorage.getItem(name),
    setItem: (name, value) => syncStorage.setItem(name, value),
    removeItem: (name) => syncStorage.removeItem(name),
};
