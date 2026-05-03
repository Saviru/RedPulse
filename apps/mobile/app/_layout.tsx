import { useThemeColor, FeedbackProvider } from "@/packages/ui/hooks";
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

import { AuthProvider, useAuth } from "@/apps/mobile/src/context/AuthContext";
import { UserProvider } from "@/apps/mobile/src/store/UserContext";
import { useRouter, useSegments, usePathname } from "expo-router";
import { UIThemeProvider } from "@/packages/ui/context/ThemeContext";
import { ToastProvider, useToast } from "@/apps/mobile/src/context/ToastContext";
import { healthCheck } from "@/apps/mobile/src/services/api";

export default function RootLayout() {
  return (
    <UIThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <UserProvider>
            <FeedbackProvider>
              <InnerLayout />
            </FeedbackProvider>
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
  const segmentString = segments.join("/");
  const isUserSection = segmentString.includes("(user)");
  const isOrgSection = segmentString.includes("(organization)");
  const isHospitalSection = segmentString.includes("(hospital)");
  const isPublicGroup = segmentString.includes("(public)");
  const inProtectedGroup = isUserSection || isOrgSection || isHospitalSection;

  // Perform API Health Check before launch
  useEffect(() => {
    async function checkServer() {
      try {
        await healthCheck();
        setIsHealthChecked(true);
      } catch (err: any) {
        showToast(err.message || "Cannot reach the server", "error", 0, true);
        setIsHealthChecked(true);
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
  }, [user, isLoading, hasLoadedAssets, segments, isHealthChecked, inProtectedGroup, isHospitalSection, isOrgSection, isUserSection]);

  if (!hasLoadedAssets || !isHealthChecked || isLoading) {
    return null;
  }


  // Prevent mounting protected screens if not logged in
  if (!user && inProtectedGroup) {
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
        />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
