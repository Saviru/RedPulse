import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Appearance, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { Button } from "@/packages/ui/components/ui/Button";
import { Divider } from "@/packages/ui/components/ui/Divider";
import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function HomeScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();

  // Check if dev tools/samples should be visible
  const showDevTools =
    Constants.expoConfig?.extra?.showDevTools === true ||
    process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === "true";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={styles.content}
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
              variant={theme === "light" ? "primary" : "secondary"}
              onPress={() => Appearance.setColorScheme("light")}
              style={{ flex: 1 }}
            />
            <Button
              label="Dark"
              variant={theme === "dark" ? "primary" : "secondary"}
              onPress={() => Appearance.setColorScheme("dark")}
              style={{ flex: 1 }}
            />
            <Button
              label="System"
              variant="secondary"
              onPress={() => Appearance.setColorScheme(null)}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
