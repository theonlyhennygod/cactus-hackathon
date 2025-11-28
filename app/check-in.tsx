import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CaptureFlow from '@/components/CaptureFlow';
import { Colors } from '@/constants/theme';

export default function CheckInScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <CaptureFlow />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
