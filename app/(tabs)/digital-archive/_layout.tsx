import { Stack } from 'expo-router';

export default function DigitalArchiveLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
