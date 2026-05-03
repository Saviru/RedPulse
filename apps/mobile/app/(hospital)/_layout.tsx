import { Stack } from "expo-router";

export default function HospitalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="campaign-invitations" />
    </Stack>
  );
}
