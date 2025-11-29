import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isOffline: boolean;
  connectionType: string | null;
}

/**
 * Hook to monitor network connectivity status
 * Used to show offline indicator and determine inference strategy
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isOffline: false,
    connectionType: null,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isOffline: !(state.isConnected ?? true),
        connectionType: state.type,
      });
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isOffline: !(state.isConnected ?? true),
        connectionType: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
