import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/packages/ui/components/ui/Button";
import { Checkbox } from "@/packages/ui/components/ui/Checkbox";
import { Radio } from "@/packages/ui/components/ui/Radio";
import { Toggle } from "@/packages/ui/components/ui/Toggle";
import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/hooks";

export default function SelectionScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(true);
  const [check3, setCheck3] = useState(false);

  const [selectedRadio, setSelectedRadio] = useState("option1");

  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);

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
          <Typo variant="h1">Selection Components</Typo>
        </View>

        <View style={styles.showcase}>
          {/* Checkboxes */}
          <View style={styles.section}>
            <Typo variant="h2">Checkbox</Typo>
            <Typo variant="caption" color="#FF3B30">
              Default States
            </Typo>
            <Checkbox
              checked={check1}
              onToggle={setCheck1}
              label="Accept terms & conditions"
            />
            <Checkbox
              checked={check2}
              onToggle={setCheck2}
              label="Subscribe to newsletter"
            />
            <Checkbox
              checked={check3}
              onToggle={setCheck3}
              label="Enable notifications"
            />
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Disabled
            </Typo>
            <Checkbox
              checked={false}
              onToggle={() => {}}
              label="Disabled unchecked"
              disabled
            />
            <Checkbox
              checked={true}
              onToggle={() => {}}
              label="Disabled checked"
              disabled
            />
          </View>

          {/* Radio Buttons */}
          <View style={styles.section}>
            <Typo variant="h2">Radio</Typo>
            <Typo variant="caption" color="#FF3B30">
              Single Selection
            </Typo>
            <Radio
              selected={selectedRadio === "option1"}
              onSelect={() => setSelectedRadio("option1")}
              label="Standard Delivery"
            />
            <Radio
              selected={selectedRadio === "option2"}
              onSelect={() => setSelectedRadio("option2")}
              label="Express Delivery"
            />
            <Radio
              selected={selectedRadio === "option3"}
              onSelect={() => setSelectedRadio("option3")}
              label="Same Day Delivery"
            />
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Disabled
            </Typo>
            <Radio
              selected={false}
              onSelect={() => {}}
              label="Disabled option"
              disabled
            />
            <Radio
              selected={true}
              onSelect={() => {}}
              label="Disabled selected"
              disabled
            />
          </View>

          {/* Toggles */}
          <View style={styles.section}>
            <Typo variant="h2">Toggle</Typo>
            <Typo variant="caption" color="#FF3B30">
              Default States
            </Typo>
            <Toggle value={toggle1} onToggle={setToggle1} label="Dark Mode" />
            <Toggle
              value={toggle2}
              onToggle={setToggle2}
              label="Push Notifications"
            />
            <Toggle
              value={toggle3}
              onToggle={setToggle3}
              label="Location Services"
            />
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Disabled
            </Typo>
            <Toggle
              value={false}
              onToggle={() => {}}
              label="Disabled off"
              disabled
            />
            <Toggle
              value={true}
              onToggle={() => {}}
              label="Disabled on"
              disabled
            />
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
});
