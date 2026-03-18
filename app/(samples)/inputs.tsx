import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/packages/ui/components/ui/Button";
import { DatePicker } from "@/packages/ui/components/ui/DatePicker";
import { Input } from "@/packages/ui/components/ui/Input";
import { Select } from "@/packages/ui/components/ui/Select";
import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/hooks";

export default function InputsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [lastDonationDate, setLastDonationDate] = useState<Date | undefined>(
    undefined,
  );

  const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const LOCATIONS = ["Colombo", "Kandy", "Galle", "Jaffna"];

  const [bloodType, setBloodType] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Button
            label="Back"
            variant="secondary"
            icon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
            onPress={() => router.back()}
            style={{ width: 100, marginBottom: 16 }}
          />
          <Typo variant="h1">Form Components</Typo>
        </View>

        <Typo variant="h2" style={{ marginBottom: 16 }}>
          Text Inputs
        </Typo>

        <View style={{ gap: 16 }}>
          <Input
            label="Email Address"
            placeholder="name@example.com"
            leftIcon={
              <Ionicons name="mail-outline" size={20} color="#687076" />
            }
          />

          <Input
            label="Disabled Input"
            placeholder="Sample input"
            disabled={true}
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color="#687076" />
            }
          />

          <Input
            label="Password"
            placeholder="Enter password"
            secureTextEntry={true}
            error="Password is too short"
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color="#687076" />
            }
          />
        </View>

        <Typo variant="h2" style={{ marginBottom: 16, marginTop: 16 }}>
          Drop downs and Pickers
        </Typo>

        <View style={{ gap: 16 }}>
          <Select
            label="Blood Type"
            placeholder="Select your blood type"
            value={bloodType}
            options={BLOOD_TYPES}
            onSelect={(selected) => setBloodType(selected)}
          />

          <Select
            label="Location"
            placeholder="Select your city"
            value={location}
            options={LOCATIONS}
            onSelect={(selected) => setLocation(selected)}
          />
        </View>

        <Typo variant="h2" style={{ marginBottom: 16, marginTop: 16 }}>
          Date Inputs
        </Typo>

        <View style={{ gap: 16 }}>
          <DatePicker
            label="Date of Birth"
            placeholder="dd/mm/yyyy"
            value={dateOfBirth}
            onChange={(newDate) => setDateOfBirth(newDate)}
          />

          <DatePicker
            label="Disabled Date"
            placeholder="dd/mm/yyyy"
            disabled={true}
            onChange={() => {}}
          />

          <DatePicker
            label="Last Donation Date"
            placeholder="dd/mm/yyyy"
            value={lastDonationDate}
            onChange={(newDate) => setLastDonationDate(newDate)}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, flexGrow: 1 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800", color: "#11181C" },
});
