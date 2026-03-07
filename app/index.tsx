import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Typo } from "@/components/ui/Typo";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typo variant="h1" style={styles.title}>
            RedPulse UI Library
          </Typo>
          <Typo variant="caption" style={styles.subtitle}>
            Demo showcase of UI elements.
          </Typo>
        </View>

        <Divider spacing={16} />

        <View style={styles.menu}>
          <Typo variant="caption" style={styles.sectionLabel}>
            UI Components
          </Typo>
          <Button
            label="Buttons"
            variant="secondary"
            onPress={() => router.push("/buttons")}
          />
          <Button
            label="Inputs"
            variant="secondary"
            onPress={() => router.push("/inputs")}
          />
          <Button
            label="Texts"
            variant="secondary"
            onPress={() => router.push("/texts")}
          />
          <Button
            label="Cards"
            variant="secondary"
            onPress={() => router.push("/cards")}
          />
          <Button
            label="Selects & Toggles"
            variant="secondary"
            onPress={() => router.push("/selections")}
          />

          <Button
            label="Badges"
            variant="secondary"
            onPress={() => router.push("/badges")}
          />

          <Button
            label="Avatars"
            variant="secondary"
            onPress={() => router.push("/avatars")}
          />
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
  title: { fontSize: 32, fontWeight: "800", color: "#11181C", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#687076" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#687076",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  menu: { width: "100%", gap: 12 },
});
