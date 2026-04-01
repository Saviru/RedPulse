import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="loading" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register-type" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-org" />
      <Stack.Screen name="register-hospital" />
    </Stack>
  );
}
