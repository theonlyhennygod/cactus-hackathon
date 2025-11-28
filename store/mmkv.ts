import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Create MMKV instance using the Nitro Modules API (v4.0+)
export const storage = createMMKV({
    id: 'pocket-wellness-storage',
    encryptionKey: 'pocket-wellness-secret-key-change-in-production'
});

export const mmkvStorage: StateStorage = {
    setItem: (name, value) => {
        storage.set(name, value);
    },
    getItem: (name) => {
        const value = storage.getString(name);
        return value ?? null;
    },
    removeItem: (name) => {
        storage.remove(name);
    },
};
