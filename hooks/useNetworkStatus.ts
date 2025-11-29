import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isOffline: boolean;
  connectionType: string | null;
}

/**
 * Hook to monitor network connectivity status
 * Uses NetInfo for accurate offline detection
 * App works fully offline - this is just for UI indication
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isOffline: false,
    connectionType: 'unknown',
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isOffline: !(state.isConnected ?? true),
        connectionType: state.type || 'unknown',
      });
      
      if (state.isConnected) {
        console.log('📶 Network connected:', state.type);
      } else {
        console.log('📴 Network offline - app continues to work locally');
      }
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isOffline: !(state.isConnected ?? true),
        connectionType: state.type || 'unknown',
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
