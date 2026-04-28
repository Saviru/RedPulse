import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import { Appearance, Animated, StyleSheet, View, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { Button, Divider, Typo, AnimatedHeader } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

export default function HomeScreen() {
  const router = useRouter();
  const { theme, colors, setThemeMode, themeMode } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Check if dev tools/samples should be visible
  const showDevTools =
    Constants.expoConfig?.extra?.showDevTools === true ||
    process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === "true";

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title="RedPulse UI"
        scrollY={scrollY}
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: Platform.OS !== "web" }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 80 + insets.top }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typo variant="h1" style={styles.title}>
            RedPulse UI Library
          </Typo>
          <Typo variant="caption" style={styles.subtitle}>
            {showDevTools
              ? "With UI Component Samples"
              : "Production Build"}
          </Typo>
        </View>

        <Divider spacing={16} color={colors.border} />

        {showDevTools && (
          <>
            <View style={styles.menu}>
              <Typo
                variant="caption"
                style={[styles.sectionLabel, { color: colors.textMuted }]}
              >
                Sample UI Components
              </Typo>
              <Button
                label="View All Components"
                variant="secondary"
                onPress={() => router.push("/(samples)")}
              />
            </View>
          </>
        )}

        <Divider spacing={16} />

        <View style={styles.menu}>
          <Typo
            variant="caption"
            style={[styles.sectionLabel, { color: colors.textMuted }]}
          >
            Change Theme
          </Typo>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Button
              label="Light"
              variant={themeMode === "light" ? "primary" : "secondary"}
              onPress={() => setThemeMode("light")}
              style={{ flex: 1 }}
            />
            <Button
              label="Dark"
              variant={themeMode === "dark" ? "primary" : "secondary"}
              onPress={() => setThemeMode("dark")}
              style={{ flex: 1 }}
            />
            <Button
              label="System"
              variant={themeMode === "system" ? "primary" : "secondary"}
              onPress={() => setThemeMode("system")}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <Divider spacing={16} color={colors.border} />

        <View style={styles.menu}>
          <Typo
            variant="caption"
            style={[styles.sectionLabel, { color: colors.textMuted }]}
          >
            Hospital Screens
          </Typo>
          <Button label="Collaborate campaigns" variant="secondary" onPress={() => router.push("/(hospital)/collaborate-campaigns" as any)} />
        </View>

        <Divider spacing={16} color={colors.border} />

        <View style={styles.menu}>
          <Typo
            variant="caption"
            style={[styles.sectionLabel, { color: colors.textMuted }]}
          >
            Organization Screens
          </Typo>
          <Button label="Campaign Assign Task" variant="secondary" onPress={() => router.push("/(organization)/campaign-assign-task" as any)} />
          <Button label="Campaign Create" variant="secondary" onPress={() => router.push("/(organization)/campaign-create" as any)} />
          <Button label="Campaign Management" variant="secondary" onPress={() => router.push("/(organization)/campaign-management" as any)} />
          <Button label="Donor Management" variant="secondary" onPress={() => router.push("/(organization)/donor-management" as any)} />
          <Button label="Donor Profile Detail" variant="secondary" onPress={() => router.push({ pathname: "/(organization)/donor-profile-detail", params: { id: "1" } } as any)} />
          <Button label="Tabs: Campaigns" variant="secondary" onPress={() => router.push("/(organization)/(tabs)/campaigns" as any)} />
        </View>

        <Divider spacing={16} color={colors.border} />

        <View style={styles.menu}>
          <Typo
            variant="caption"
            style={[styles.sectionLabel, { color: colors.textMuted }]}
          >
            User Screens
          </Typo>
          <Button label="Campaign Registration" variant="secondary" onPress={() => router.push("/(user)/local-collaboration-camps" as any)} />
          <Button label="Campaign Tasks" variant="secondary" onPress={() => router.push("/(user)/campaign-tasks" as any)} />
          <Button label="Campaign Volunteer" variant="secondary" onPress={() => router.push("/(user)/campaign-volunteer" as any)} />
          <Button label="Tabs: Home" variant="secondary" onPress={() => router.push("/(user)/(tabs)/home" as any)} />
          <Button label="Tabs: Home 2" variant="secondary" onPress={() => router.push("/(user)/(tabs)/home2" as any)} />
          <Button label="Available Camps" variant="secondary" onPress={() => router.push("/(user)/available-camps" as any)} />
        </View>

        <View style={{ height: 32 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  header: { marginBottom: 32, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#687076",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  menu: { width: "100%", gap: 12 },
});
