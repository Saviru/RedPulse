import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Divider,
  Input,
  Select,
  DatePicker,
} from "@/packages/ui/components/ui";
import { styles as selectStyles } from "@/packages/ui/components/ui/Select/Select.styles";
import { useThemeColor } from "@/packages/ui/hooks";
import { changeHospital } from "@/apps/mobile/src/services/campaignService";
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";
import { getHospitals, HospitalOption } from "@/apps/mobile/src/services/organizationService";

function parseDate(iso?: string | string[]): Date {
  const raw = Array.isArray(iso) ? iso[0] : iso;
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function paramString(v?: string | string[], fallback = ""): string {
  const raw = Array.isArray(v) ? v[0] : v;
  return raw ?? fallback;
}

function LockedTimeField({ label, value }: { label: string; value: Date }) {
  const { colors, theme } = useThemeColor();
  const display = useMemo(
    () =>
      value.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    [value],
  );

  return (
    <View style={selectStyles.container}>
      <Text style={[selectStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <View
        style={[
          selectStyles.selectBox,
          {
            backgroundColor:
              theme === "dark" ? colors.surface : colors.background,
            borderColor: colors.border,
            opacity: 0.7,
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[selectStyles.valueText, { color: colors.text }]}>{display}</Text>
        <View style={selectStyles.iconRight}>
          <Ionicons name="time-outline" size={20} color={colors.icon} />
        </View>
      </View>
    </View>
  );
}

export default function CampaignChangeHospitalScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeColor();
  const params = useLocalSearchParams<{
    campaignName?: string;
    campaignId?: string;
    campDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    coordinatorName?: string;
    coordinatorPhone?: string;
    hospital?: string;
    maxCapacity?: string;
    description?: string;
  }>();

  const locked = useMemo(() => {
    const name = paramString(params.campaignName, "Community Blood Drive");
    const campDate = parseDate(params.campDate);
    const start = parseDate(params.startTime);
    const end = parseDate(params.endTime);
    return {
      name,
      campDate,
      startTime: start,
      endTime: end,
      location: paramString(params.location, "Central Community Hall"),
      coordinatorName: paramString(params.coordinatorName, "Alex Morgan"),
      coordinatorPhone: paramString(params.coordinatorPhone, "+1 555-0100"),
      maxCapacity: paramString(params.maxCapacity, "50"),
      description: paramString(params.description, ""),
    };
  }, [params]);

  const initialHospital = paramString(
    params.hospital,
    "City General Hospital",
  );

  const [selectedHospital, setSelectedHospital] = useState(initialHospital);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await getHospitals();
        setHospitals(data);
      } catch (error) {
        alert(`Failed to load hospitals: ${getApiErrorMessage(error)}`);
      }
    };
    loadHospitals();
  }, []);

  const formCardStyle = useMemo(
    () => [
      styles.formCard,
      {
        borderColor: colors.tint,
        backgroundColor: colors.background,
      },
    ],
    [colors.background, colors.tint],
  );

  const fieldSurface = {
    backgroundColor: theme === "dark" ? colors.surface : colors.background,
  };

  const handleSubmit = async () => {
    if (!selectedHospital) {
      alert("Please select a hospital.");
      return;
    }
    const campaignId = paramString(params.campaignId);
    if (!campaignId) {
      alert("Campaign ID missing. Open this screen from campaign details.");
      return;
    }
    const hospital = hospitals.find((h) => h.name === selectedHospital);
    if (!hospital) {
      alert("Selected hospital is invalid.");
      return;
    }

    try {
      setSubmitting(true);
      await changeHospital(campaignId, hospital.id);
      alert("Hospital updated successfully.");
      router.back();
    } catch (error) {
      alert(`Failed to change hospital: ${getApiErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Change Hospital
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={formCardStyle}>
          <Input
            label="Name"
            placeholder="Enter Campaign Name"
            value={locked.name}
            disabled
          />
          <DatePicker
            label="Date"
            value={locked.campDate}
            onChange={() => {}}
            placeholder="Select date"
            disabled
            style={fieldSurface}
          />
          <LockedTimeField label="Start time" value={locked.startTime} />
          <LockedTimeField label="End time" value={locked.endTime} />
          <Input
            label="Location"
            placeholder="Enter Venue"
            value={locked.location}
            disabled
          />
          <Input
            label="Coordinator name"
            placeholder="Enter campaign coordinator name"
            value={locked.coordinatorName}
            disabled
          />
          <Input
            label="Coordinator phone number"
            placeholder="Enter Coordinator phone number"
            value={locked.coordinatorPhone}
            disabled
            keyboardType="phone-pad"
          />

          <Divider spacing={8} />

          <Select
            label="Collaborate Hospital"
            placeholder="Select a hospital"
            value={selectedHospital}
            options={hospitals.map((h) => h.name)}
            onSelect={setSelectedHospital}
          />
          <Input
            label="Maximum donor capacity"
            placeholder="50"
            value={locked.maxCapacity}
            disabled
            keyboardType="number-pad"
          />
          <Input
            label="Description"
            placeholder="Optional"
            value={locked.description}
            disabled
          />

          <Button
            label="Change hospital"
            variant="primary"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { marginRight: 15 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
    width: "100%",
  },
});
