import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthGate from '@/components/AuthGate';
import { Colors } from '@/constants/theme';
import { useSettingsStore } from '@/store';

export default function RootLayout() {
  const { isPrivacyMode } = useSettingsStore();

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
