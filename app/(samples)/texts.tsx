import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/packages/ui/components/ui/Button";
import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/theme/useThemeColor";

export default function TextsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Button
            label="Back"
            variant="secondary"
            icon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
            onPress={() => router.back()}
            style={{ width: 100, marginBottom: 16 }}
          />
          <Typo variant="h1">Text Examples</Typo>
        </View>

        <View style={styles.showcase}>
          <View style={styles.section}>
            <Typo variant="caption" color="#ff0000">
              Heading 1 (h1)
            </Typo>
            <Typo variant="h1">The quick brown fox jumps.</Typo>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#ff0000">
              Heading 2 (h2)
            </Typo>
            <Typo variant="h2">The quick brown fox jumps.</Typo>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#ff0000">
              Body text
            </Typo>
            <Typo variant="body">
              This is the standard body text. It is used for paragraphs,
              descriptions, and general readability across the application. It
              has a nice line height to make long blocks of text easy to digest.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#ff0000">
              Caption text
            </Typo>
            <Typo variant="caption">
              This is caption text. It is smaller and automatically greyed out.
              Perfect for timestamps, small disclaimers, or minor hints.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#ff0000">
              Alignment Override
            </Typo>
            <Typo variant="body" align="center">
              You can easily center text using the align prop!
            </Typo>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  header: { marginBottom: 32 },
  showcase: { gap: 24 },
  section: { gap: 4 },
});
