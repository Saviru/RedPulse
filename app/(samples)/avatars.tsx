import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/packages/ui/components/ui/Avatar";
import { Button } from "@/packages/ui/components/ui/Button";
import { Typo } from "@/packages/ui/components/ui/Typo";

export default function AvatarsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Button
            label="Back"
            variant="secondary"
            icon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
            onPress={() => router.back()}
            style={{ width: 100, marginBottom: 16 }}
          />
          <Typo variant="h1">Avatar Components</Typo>
        </View>

        <View style={styles.showcase}>
          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Sizes
            </Typo>
            <View style={styles.row}>
              <Avatar size={32} />
              <Avatar size={48} />
              <Avatar size={64} />
              <Avatar size={96} />
            </View>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Custom Fallback Icons
            </Typo>
            <View style={styles.row}>
              <Avatar size={56} fallbackIcon="person" />
              <Avatar size={56} fallbackIcon="people" />
              <Avatar size={56} fallbackIcon="business" />
              <Avatar size={56} fallbackIcon="medical" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 32 },
  showcase: { gap: 28 },
  section: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
});
