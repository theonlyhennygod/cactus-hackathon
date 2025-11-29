import { Stack } from 'expo-router';

export default function FeaturesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="heart-scan" />
      <Stack.Screen name="lung-sound" />
      <Stack.Screen name="tremor-test" />
      <Stack.Screen name="skin-scan" />
    </Stack>
  );
}
