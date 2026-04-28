import { useThemeColor } from "@/packages/ui/hooks";
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
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

import { UIThemeProvider } from "@/packages/ui/context/ThemeContext";

export default function RootLayout() {
  return (
    <UIThemeProvider>
      <InnerLayout />
    </UIThemeProvider>
  );
}

function InnerLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
    ...Ionicons.font,
  });
  const hasLoadedAssets = fontsLoaded;
  
  const { theme, colors } = useThemeColor();

  // Injects the theme colors into the root configs
  const navTheme =
    theme === "dark"
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
    // Passes the native theme prop down to Expo Router so modals, alerts, and navigation headers match system theme
    <ThemeProvider value={navTheme}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            // Global header
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
