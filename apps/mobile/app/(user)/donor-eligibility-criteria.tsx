import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo } from "@/packages/ui/components/ui";

export default function DonorEligibilityCriteriaScreen() {
  const router = useRouter();
  const { expand } = useLocalSearchParams();
  const { colors } = useThemeColor();
  const [expandedHemoglobin, setExpandedHemoglobin] = useState(false);
  const [expandedBloodPressure, setExpandedBloodPressure] = useState(false);

  useEffect(() => {
    if (expand === "hemoglobin") setExpandedHemoglobin(true);
    if (expand === "bloodPressure") setExpandedBloodPressure(true);
  }, [expand]);

  const basicCriteria = [
    "Aged 18-60 years (first-time donors: up to 55 years).",
    "Minimum 4 months between donations.",
    "Weight above 50 kg.",
    "Haemoglobin above 12.5 g/dL.",
    "Not pregnant; free from serious medical illnesses.",
    "Bring National Identity Card or valid ID.",
  ];

  const travelDeferrals = [
    "Malaria-endemic country travel: deferred for 3 years from date of return.",
    "Other foreign travel: deferred for 3 months from date of return.",
  ];

  const hemoglobinTips = [
    "Eat Iron-Rich Foods (Heme Iron) - Include red meat, liver, poultry, and fish/shellfish.",
    "Eat Iron-Rich Foods (Non-Heme Iron) - Add spinach, beans, lentils, tofu, fortified cereals, and dried fruits.",
    "Boost Absorption with Vitamin C - Combine plant-based iron with Vitamin C (orange juice, lemon juice, berries).",
    "Avoid Iron Blockers Around Meals - Avoid tea, coffee, red wine, and calcium-rich foods near iron-rich meals.",
    "Consider Supplements Carefully - Only take iron supplements with medical advice.",
    "Wait and Retest - It can take several weeks of dietary changes to improve hemoglobin levels."
  ];

  const bloodPressureTips = [
    "Follow a Balanced Diet (DASH-style) - Focus on fruits, vegetables, whole grains, lean proteins. Reduce salt to less than 1,500-2,300 mg sodium per day.",
    "Maintain a Healthy Weight - Losing 5-10 pounds can significantly lower blood pressure.",
    "Exercise Regularly - Aim for 150 minutes of moderate exercise per week (brisk walking, cycling, swimming).",
    "Limit Alcohol and Caffeine - Drink in moderation (up to 1 drink/day for women, 2 for men). Monitor caffeine response.",
    "Manage Stress - Try deep breathing, meditation, relaxing activities, and ensure adequate sleep.",
    "Quit Smoking - Each cigarette raises blood pressure for several minutes. Quitting helps blood vessel function.",
    "Monitor Regularly - Check blood pressure at home or pharmacies to keep it below 120/80 mmHg."
  ];

  const bulletsSection = (title: string, items: string[]) => (
    <View style={styles.section}>
      <Typo variant="h2" style={styles.sectionTitle}>
        {title}
      </Typo>

      <View style={styles.bulletList}>
        {items.map((text) => (
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
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Typo variant="h2" style={styles.headerTitle}>
            How to become eligible
          </Typo>
          <View style={{ width: 32 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {bulletsSection("Basic Donor Eligibility Criteria", basicCriteria)}
          {bulletsSection("Travel-Related Deferrals", travelDeferrals)}
          
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setExpandedHemoglobin(!expandedHemoglobin)}
            >
              <Typo variant="h2" style={styles.dropdownTitle}>
                How to maintain your hemoglobin level?
              </Typo>
              <MaterialIcons
                name={expandedHemoglobin ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            
            {expandedHemoglobin && (
              <View style={styles.dropdownContent}>
                <Typo variant="body" style={styles.dropdownIntro}>
                  To achieve the required hemoglobin level for blood donation, focus on increasing your iron intake and improving absorption.
                </Typo>
                <View style={styles.bulletList}>
                  {hemoglobinTips.map((text, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <Typo variant="body" style={styles.bulletNumber}>
                        {index + 1}.
                      </Typo>
                      <Typo variant="body" style={styles.bulletText}>
                        {text}
                      </Typo>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setExpandedBloodPressure(!expandedBloodPressure)}
            >
              <Typo variant="h2" style={styles.dropdownTitle}>
                How to maintain healthy blood pressure?
              </Typo>
              <MaterialIcons
                name={expandedBloodPressure ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            
            {expandedBloodPressure && (
              <View style={styles.dropdownContent}>
                <View style={styles.bulletList}>
                  {bloodPressureTips.map((text, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <Typo variant="body" style={styles.bulletNumber}>
                        {index + 1}.
                      </Typo>
                      <Typo variant="body" style={styles.bulletText}>
                        {text}
                      </Typo>
                    </View>
                  ))}
                </View>
              </View>
            )}
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

  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12, color: "#F54927", paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: "#EF4444" },

  bulletList: { gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { fontSize: 18, lineHeight: 24 },
  bulletNumber: { fontSize: 14, lineHeight: 24, fontWeight: "600", minWidth: 20 },
  bulletText: { flex: 1, lineHeight: 24 },
  
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  dropdownContent: { marginTop: 12, paddingHorizontal: 4 },
  dropdownIntro: { marginBottom: 12, fontStyle: "italic", lineHeight: 22 },
});

