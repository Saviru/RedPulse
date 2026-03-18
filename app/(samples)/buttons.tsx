import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/packages/ui/components/ui/Button";
import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/hooks/useThemeColor";

const handlePrimaryPress = () => {
  Alert.alert("Success!", "The button architecture is working perfectly.");
};

export default function ButtonsScreen() {
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

          <Typo variant="h1">Button Components</Typo>
        </View>

        <View style={styles.header}>
          <Button
            label="Primary Action"
            variant="primary"
            onPress={handlePrimaryPress}
          />

          <Button
            label="Secondary Action"
            variant="secondary"
            onPress={() => console.log("Secondary pressed")}
            style={{ marginTop: 16 }}
          />

          <Button
            label="Delete Account"
            variant="danger"
            onPress={() => console.log("Danger pressed")}
            style={{ marginTop: 16 }}
          />

          <Button
            label="Download Report"
            icon={
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            }
            style={{ marginTop: 16 }}
          />

          <Button
            label="Checkout"
            variant="secondary"
            iconPosition="right"
            icon={<Ionicons name="arrow-forward" size={20} color="#1C1C1E" />}
            style={{ marginTop: 16 }}
          />

          <Button
            label="Checkout"
            variant="secondary"
            icon={<Ionicons name="arrow-forward" size={20} color="#1C1C1E" />}
            style={{ marginTop: 16 }}
          />

          <Button
            label="Fetching Data..."
            variant="primary"
            isLoading={true}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800", color: "#11181C" },
});
