import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo } from "@/packages/ui/components/ui";

export default function RegisterTypeScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();

  return (
    <View style={styles.backdrop}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.flexSpacer} />

        <View style={[styles.bottomSheet, { backgroundColor: theme === "dark" ? "#1A1A1A" : "#FFFFFF" }]}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <Typo variant="h1" style={styles.title}>I represent a...</Typo>
            <Typo variant="caption" color={colors.textMuted} style={styles.subtitle}>
              Select your organization type to continue registration.
            </Typo>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionCard, { backgroundColor: theme === "dark" ? colors.background : "#F8F9FA", borderColor: colors.border }]}
              onPress={() => router.push("/register-hospital")}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: `${colors.tint}1A` }]}>
                <MaterialIcons name="local-hospital" size={28} color={colors.tint} />
              </View>
              <View style={styles.optionTextContainer}>
                <Typo variant="h2" style={styles.optionTitle}>Hospital</Typo>
                <Typo variant="caption" color={colors.textMuted}>Medical centers, clinics & urgent care</Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionCard, { backgroundColor: theme === "dark" ? colors.background : "#F8F9FA", borderColor: colors.border }]}
              onPress={() => router.push("/register-org")}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: `${colors.tint}1A` }]}>
                <MaterialIcons name="diversity-3" size={28} color={colors.tint} />
              </View>
              <View style={styles.optionTextContainer}>
                <Typo variant="h2" style={styles.optionTitle}>Organization</Typo>
                <Typo variant="caption" color={colors.textMuted}>Blood banks, NGOs & donation campaigns</Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
              <Typo variant="body" color={colors.textMuted} style={styles.cancelText}>Cancel Registration</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  flexSpacer: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  cancelText: {
    fontWeight: "bold",
  },
});
