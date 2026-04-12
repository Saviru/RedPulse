import { FeedbackProvider, useThemeColor } from "@/packages/ui/hooks";
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
  const colorScheme = useColorScheme();
  const { colors } = useThemeColor();

  const navTheme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: { ...DarkTheme.colors, background: colors.background },
        }
      : {
          ...DefaultTheme,
          colors: { ...DefaultTheme.colors, background: colors.background },
        };

  useEffect(() => {
    if (hasLoadedAssets) {
      SplashScreen.hideAsync();
    }
  }, [hasLoadedAssets]);

  if (!hasLoadedAssets) {
    return null;
  }

  return (
    <ThemeProvider value={navTheme}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
        <FeedbackProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" />
          </Stack>
        </FeedbackProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
