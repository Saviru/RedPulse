import { useThemeColor } from "@/packages/ui/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge , Button , Typo } from "@/packages/ui/components/ui";



export default function BadgesScreen() {
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
          <Typo variant="h1">Badge Components</Typo>
        </View>

        <View style={styles.showcase}>
          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Variants
            </Typo>
            <View style={styles.row}>
              <Badge label="Default" variant="default" />
              <Badge label="Success" variant="success" />
              <Badge label="Warning" variant="warning" />
              <Badge label="Danger" variant="danger" />
              <Badge label="Info" variant="info" />
            </View>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Use Cases
            </Typo>
            <View style={styles.row}>
              <Badge label="A+" variant="danger" />
              <Badge label="O-" variant="info" />
              <Badge label="Urgent" variant="danger" />
              <Badge label="Active" variant="success" />
              <Badge label="Pending" variant="warning" />
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
