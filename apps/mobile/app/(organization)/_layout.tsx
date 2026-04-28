import { Stack } from "expo-router";

export default function OrganizationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="campaign-create" />
      <Stack.Screen name="campaign-change-hospital" />
      <Stack.Screen name="campaign-management" />
      <Stack.Screen name="campaign-volunteers" />
      <Stack.Screen name="campaign-assign-task" />
    </Stack>
  );
}
