import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo } from "@/packages/ui/components/ui";

export default function PostDonationCareScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const bullets = [
    "Rest for at least 20 minutes.",
    "Drink more fluids in the next 4 hours.",
    "Keep the plaster on for about 12 hours.",
    "Avoid heavy lifting or strenuous activity for 24 hours,",
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Typo variant="h2" style={styles.headerTitle}>
            Post Donation Care
          </Typo>
          <View style={{ width: 32 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Typo variant="body" style={styles.introText}>
            After Donating Blood.
          </Typo>

          <View style={styles.bulletList}>
            {bullets.map((text) => (
              <View key={text} style={styles.bulletRow}>
                <Typo variant="body" style={styles.bulletDot}>
                  •
                </Typo>
                <Typo variant="body" style={styles.bulletText}>
                  {text}
                </Typo>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "700" },

  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  introText: { fontSize: 24, fontWeight: "800", marginBottom: 16, color: "#F54927", paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: "#EF4444" },

  bulletList: { gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { fontSize: 18, lineHeight: 24 },
  bulletText: { flex: 1, lineHeight: 24 },
});

