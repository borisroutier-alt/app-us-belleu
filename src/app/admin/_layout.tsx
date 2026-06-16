import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-sponsor" />
      <Stack.Screen name="calendrier-gestion" />
      <Stack.Screen name="messages" />
    </Stack>
  );
}