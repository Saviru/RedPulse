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
            Hospital
          </Typo>
          <Button label="Home" variant="secondary" onPress={() => router.push("/(hospital)/(tabs)/home")} />
          <Button label="Profile" variant="secondary" onPress={() => router.push("/(hospital)/(tabs)/profile" as any)} />
          <Button label="Edit Profile" variant="secondary" onPress={() => router.push("/(hospital)/edit-profile")} />
          <Button label="Point Shop" variant="secondary" onPress={() => router.push("/(hospital)/manage-shop")} />
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
