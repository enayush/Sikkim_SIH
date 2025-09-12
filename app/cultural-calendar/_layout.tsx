import { Stack } from 'expo-router';

export default function CulturalCalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Cultural Calendar',
        }}
      />
    </Stack>
  );
}
