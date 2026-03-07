import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const hasLoadedAssets = true;
  // Get device theme to pass to the Native navigation container
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (hasLoadedAssets) {
      SplashScreen.hideAsync();
    }
  }, [hasLoadedAssets]);

  if (!hasLoadedAssets) {
    return null;
  }

  return (
    // Passes the native theme prop down to Expo Router so modals, alerts, and navigation headers match system theme
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
    </ThemeProvider>
  );
}
