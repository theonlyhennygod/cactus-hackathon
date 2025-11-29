import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isOffline: boolean;
  connectionType: string | null;
}

/**
 * Hook to monitor network connectivity status
 * Uses a safe fallback for Expo Go compatibility
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isOffline: false,
    connectionType: 'unknown',
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initNetInfo = async () => {
      try {
        // Dynamically import to avoid Expo Go crash
        const NetInfo = await import('@react-native-community/netinfo');
        
        // Subscribe to network state updates
        unsubscribe = NetInfo.default.addEventListener((state) => {
          setStatus({
            isConnected: state.isConnected ?? true,
            isOffline: !(state.isConnected ?? true),
            connectionType: state.type,
          });
        });

        // Get initial state
        const state = await NetInfo.default.fetch();
        setStatus({
          isConnected: state.isConnected ?? true,
          isOffline: !(state.isConnected ?? true),
          connectionType: state.type,
        });
      } catch (error) {
        // NetInfo not available (Expo Go) - assume online
        console.log('NetInfo not available, assuming online');
        setStatus({
          isConnected: true,
          isOffline: false,
          connectionType: 'unknown',
        });
      }
    };

    initNetInfo();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return status;
}
