import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="local-collaboration-camps" />
      <Stack.Screen name="campaign-registration" />
      <Stack.Screen name="available-camps" />
      <Stack.Screen name="campaign-volunteer" />
      <Stack.Screen name="campaign-tasks" />
    </Stack>
  );
}
