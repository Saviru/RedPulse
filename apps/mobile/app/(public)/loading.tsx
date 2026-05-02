import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

export default function LoadingScreen() {
  const { theme, colors } = useThemeColor();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.topSpacer} />

      <View style={styles.centerArea}>
        <View style={[styles.logoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="bloodtype" size={64} color={colors.tint} />
        </View>
        <Typo variant="h1" style={styles.title}>RedPulse</Typo>
        <Typo variant="body" color={colors.textMuted}>Connecting donors, saving lives.</Typo>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Typo variant="caption" style={styles.loadingText}>LOADING</Typo>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 32,
  },
  topSpacer: {
    flex: 1,
  },
  centerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 10,
  },
  logoContainer: {
    width: 128,
    height: 128,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  bottomArea: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 48,
    width: "100%",
  },
  spinnerContainer: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
  },
});
