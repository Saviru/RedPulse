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
      <Stack.Screen name="collaborate-campaigns" />
      <Stack.Screen name="donor-donation-details" />
    </Stack>
  );
}
