import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const hasLoadedAssets = true;

  useEffect(() => {
    if (hasLoadedAssets) {
      SplashScreen.hideAsync();
    }
  }, [hasLoadedAssets]);

  if (!hasLoadedAssets) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          // Global header
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaProvider>
  );
}
