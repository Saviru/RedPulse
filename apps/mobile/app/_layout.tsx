import { useThemeColor } from "@/packages/ui/hooks";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { UserProvider } from "./store/UserContext";
import { useRouter, useSegments, usePathname } from "expo-router";
import { UIThemeProvider } from "@/packages/ui/context/ThemeContext";
import { ToastProvider, useToast } from "../src/context/ToastContext";
import { healthCheck } from "../src/services/api";

export default function RootLayout() {
  return (
    <UIThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <UserProvider>
            <InnerLayout />
          </UserProvider>
        </AuthProvider>
      </ToastProvider>
    </UIThemeProvider>
  );
}

function InnerLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
    ...Ionicons.font,
  });
  const hasLoadedAssets = fontsLoaded;
  const { showToast } = useToast();
  const [isHealthChecked, setIsHealthChecked] = useState(false);

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

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Perform API Health Check before launch
  useEffect(() => {
    async function checkServer() {
      try {
        await healthCheck();
        setIsHealthChecked(true);
      } catch (err: any) {
        // Show persistent toast on network/connection failure
        showToast(err.message || 'Cannot reach the server', 'error', 0, true);
        setIsHealthChecked(true); // Still proceed, allow cached or retry logic
      }
    }
    checkServer();
  }, []);

  useEffect(() => {
    if (hasLoadedAssets && isHealthChecked) {
      SplashScreen.hideAsync();
    }
  }, [hasLoadedAssets, isHealthChecked]);

  useEffect(() => {
    if (!hasLoadedAssets || isLoading || !isHealthChecked) return;

    const segmentString = segments.join('/');
    const isUserSection = segmentString.includes('(user)');
    const isOrgSection = segmentString.includes('(organization)');
    const isHospitalSection = segmentString.includes('(hospital)');
    const inProtectedGroup = isUserSection || isOrgSection || isHospitalSection;

    // Detect public screens
    const isPublicGroup = segmentString.includes('(public)');

    if (!user && inProtectedGroup) {
      // Redirect to login if unauthenticated user tries to access a protected route
      router.replace('/(public)/welcome');
    } else if (user) {
      const role = String(user.role || '').toUpperCase();

      // Role-based redirection
      const dashboardMap: Record<string, string> = {
        'HOSPITAL': '/(hospital)/(tabs)/home',
        'ORGANIZATION': '/(organization)/(tabs)/home',
        'USER': '/(user)/(tabs)/home'
      };

      const correctDashboard = dashboardMap[role];

      // If in a PUBLIC group (login/welcome) and logged in, redirect to THEIR CORRECT dashboard
      if (isPublicGroup && correctDashboard) {
        console.log(`[AuthRedirect] Moving ${role} from public screen to dashboard: ${correctDashboard}`);
        router.replace(correctDashboard as any);
        return;
      }

      // 2. If explicitly in a WRONG protected group, redirect to THEIR CORRECT dashboard
      const isIncorrectSection =
        (isHospitalSection && role !== 'HOSPITAL') ||
        (isOrgSection && role !== 'ORGANIZATION') ||
        (isUserSection && role !== 'USER');

      if (isIncorrectSection && correctDashboard) {
        console.log(`[AuthRedirect] Routing ${role} to authorized section: ${correctDashboard}`);
        router.replace(correctDashboard as any);
      }
    }
  }, [user, isLoading, hasLoadedAssets, segments, isHealthChecked]);

  if (!hasLoadedAssets || !isHealthChecked) {
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
