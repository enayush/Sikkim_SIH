import { Stack } from 'expo-router';

export default function JournalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Explorer\'s Journal',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Journal Entry',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Journal Entry',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}