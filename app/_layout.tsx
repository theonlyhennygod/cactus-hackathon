import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthGate from '@/components/AuthGate';
import { Colors } from '@/constants/theme';
import { useSettingsStore } from '@/store';

// Suppress known Cactus SDK runtime errors that don't affect functionality
LogBox.ignoreLogs([
  'Unknown std::runtime_error',
  'Uncaught (in promise',
]);

export default function RootLayout() {
  const { isPrivacyMode } = useSettingsStore();

  // Handle unhandled promise rejections from native modules gracefully
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      // Suppress Cactus SDK runtime errors that occur during cleanup
      if (event.reason?.message?.includes('std::runtime_error')) {
        console.log('ℹ️ Suppressed Cactus SDK cleanup error');
        event.preventDefault();
      }
    };
    
    // @ts-ignore - global handler
    if (typeof global !== 'undefined') {
      // @ts-ignore
      global.onunhandledrejection = handler;
    }
    
    return () => {
      // @ts-ignore
      if (typeof global !== 'undefined') {
        // @ts-ignore
        global.onunhandledrejection = undefined;
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGate>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: Colors.light.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="check-in" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="results" options={{ animation: 'fade' }} />
            <Stack.Screen name="settings" />
          </Stack>
        </AuthGate>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
