import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Button, Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.topArea}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.tint}1A` }]}>
            <MaterialIcons name="monitor-heart" size={24} color={colors.tint} />
          </View>
          <Typo variant="h2" style={styles.appName}>RedPulse</Typo>
        </View>

        <View style={[styles.heroImageContainer, { backgroundColor: `${colors.tint}1A` }]}>
          <MaterialIcons name="bloodtype" size={100} color={colors.tint} />
        </View>

        <View style={styles.textContainer}>
          <Typo variant="h1" style={styles.title}>
            Pulse for life,{"\n"}
            <Typo variant="h1" color={colors.tint}>blood for all.</Typo>
          </Typo>
        </View>
      </View>

      <View style={[styles.actionArea, { backgroundColor: theme === "dark" ? colors.surface : "rgba(255,255,255,0.5)" }]}>
        <Button
          label="Create a Personal account"
          variant="primary"
          icon={<MaterialIcons name="person-add" size={20} />}
          iconPosition="right"
          onPress={() => router.push("/register")}
          style={styles.primaryButton}
        />
        <Button
          label="Register as an organization"
          variant="secondary"
          icon={<MaterialIcons name="business" size={20} />}
          iconPosition="right"
          onPress={() => router.push("/register-type")}
          style={styles.secondaryButton}
        />

        <View style={styles.loginPromptContainer}>
          <Typo variant="body" color={colors.textMuted} style={styles.loginPromptText}>
            Already have an account?{" "}
          </Typo>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Typo variant="body" color={colors.tint} style={styles.loginLink}>Log in</Typo>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topArea: {
    padding: 24,
    paddingTop: 48,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 48,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  heroImageContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -1,
  },
  actionArea: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)", 
  },
  loginPromptContainer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPromptText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
