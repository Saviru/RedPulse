import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import {
  Button,
  Divider,
  Input,
  Select,
  DatePicker,
} from "@/packages/ui/components/ui";
import { styles as selectStyles } from "@/packages/ui/components/ui/Select/Select.styles";
import { useThemeColor } from "@/packages/ui/hooks";
import { createCampaign } from "@/apps/mobile/src/lib/campaignService";
import { getHospitals, HospitalOption } from "@/apps/mobile/src/lib/organizationService";

function defaultStartTime() {
  const d = new Date();
  d.setHours(3, 24, 0, 0);
  return d;
}

function defaultEndTime() {
  const d = new Date();
  d.setHours(5, 24, 0, 0);
  return d;
}

function TimePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [show, setShow] = useState(false);
  const [webInput, setWebInput] = useState("");
  const [webError, setWebError] = useState<string | null>(null);
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

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selected) {
      onChange(selected);
    }
    if (Platform.OS === "ios" && selected) {
      setShow(false);
    }
  };

  const webTimeValue = `${String(value.getHours()).padStart(2, "0")}:${String(
    value.getMinutes(),
  ).padStart(2, "0")}`;

  useEffect(() => {
    if (Platform.OS === "web") {
      setWebInput(webTimeValue);
    }
  }, [webTimeValue]);

  const parseStrictTime = (raw: string): { hours: number; minutes: number } | null => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
    if (!match) return null;
    return { hours: Number(match[1]), minutes: Number(match[2]) };
  };

  const onWebTimeChange = (nextValue: string) => {
    setWebInput(nextValue);
    if (!nextValue) {
      setWebError("Time is required");
      return;
    }
    const parsed = parseStrictTime(nextValue);
    if (!parsed) {
      setWebError("Use HH:mm");
      return;
    }
    setWebError(null);
    const next = new Date(value);
    next.setHours(parsed.hours, parsed.minutes, 0, 0);
    onChange(next);
  };

  return (
    <View style={selectStyles.container}>
      <Text style={[selectStyles.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      {Platform.OS === "web" ? (
        <View
          style={[
            selectStyles.selectBox,
            {
              backgroundColor:
                theme === "dark" ? colors.surface : colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={webInput}
            onChangeText={onWebTimeChange}
            placeholder="HH:mm"
            placeholderTextColor={theme === "dark" ? "#5C5C5E" : "#8E8E93"}
            style={[selectStyles.valueText, { color: colors.text, paddingVertical: 0 }]}
          />
          <View style={selectStyles.iconRight}>
            <Ionicons name="time-outline" size={20} color={colors.icon} />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            selectStyles.selectBox,
            {
              backgroundColor:
                theme === "dark" ? colors.surface : colors.background,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setShow(true)}
        >
          <Text style={[selectStyles.valueText, { color: colors.text }]}>
            {display}
          </Text>
          <View style={selectStyles.iconRight}>
            <Ionicons name="time-outline" size={20} color={colors.icon} />
          </View>
        </TouchableOpacity>
      )}
      {show && (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
          themeVariant={theme}
        />
      )}
      {Platform.OS === "web" && webError ? (
        <Text style={[selectStyles.errorText, { color: colors.error }]}>{webError}</Text>
      ) : null}
    </View>
  );
}

export default function CampaignCreateScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeColor();

  const [name, setName] = useState("");
  const [campDate, setCampDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(defaultStartTime);
  const [endTime, setEndTime] = useState<Date>(defaultEndTime);
  const [location, setLocation] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorPhone, setCoordinatorPhone] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("50");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  React.useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await getHospitals();
        setHospitals(data);
      } catch (error) {
        alert(`Failed to load hospitals: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    loadHospitals();
  }, []);

  const toIsoWithTime = (datePart: Date, timePart: Date) => {
    const merged = new Date(datePart);
    merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
    return merged.toISOString();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Please enter a camp name.");
      return;
    }
    if (!location.trim()) {
      alert("Please enter a location.");
      return;
    }
    if (!coordinatorName.trim()) {
      alert("Please enter the coordinator name.");
      return;
    }
    if (!coordinatorPhone.trim()) {
      alert("Please enter the coordinator phone number.");
      return;
    }
    if (!selectedHospital) {
      alert("Please select a hospital.");
      return;
    }
    const hospital = hospitals.find((h) => h.name === selectedHospital);
    if (!hospital) {
      alert("Selected hospital is invalid.");
      return;
    }
    const cap = parseInt(maxCapacity, 10);
    if (!maxCapacity.trim() || Number.isNaN(cap) || cap < 1) {
      alert("Please enter a valid maximum donor capacity.");
      return;
    }
    try {
      setSubmitting(true);
      setFieldErrors({}); // Reset previous errors

      await createCampaign({
        hospitalId: hospital.id,
        name: name.trim(),
        date: campDate.toISOString(),
        startTime: toIsoWithTime(campDate, startTime),
        endTime: toIsoWithTime(campDate, endTime),
        location: location.trim(),
        coordinatorName: coordinatorName.trim(),
        coordinatorPhone: coordinatorPhone.trim(),
        maxCapacity: cap,
        description: description.trim(),
      });
      alert(
        "Camp created successfully. Collaboration request sent to selected hospital.",
      );
      router.back();
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 400 && 'details' in error) {
        const details = (error as any).details;
        if (details && typeof details === 'object' && 'errors' in details) {
           setFieldErrors(details.errors);
           return;
        }
      }
      alert(`Failed to create campaign: ${error instanceof Error ? error.message : String(error)}`);
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
          Create Camp
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
            value={name}
            onChangeText={setName}
            error={fieldErrors.name}
          />
          <DatePicker
            label="Date"
            value={campDate}
            onChange={setCampDate}
            placeholder="Select date"
            style={{
              backgroundColor:
                theme === "dark" ? colors.surface : colors.background,
            }}
            error={fieldErrors.date}
          />
          <TimePickerField
            label="Start time"
            value={startTime}
            onChange={setStartTime}
          />
          <TimePickerField
            label="End time"
            value={endTime}
            onChange={setEndTime}
          />
          <Input
            label="Location"
            placeholder="Enter Venue"
            value={location}
            onChangeText={setLocation}
            error={fieldErrors.location}
          />
          <Input
            label="Coordinator name"
            placeholder="Enter campaign coordinator name"
            value={coordinatorName}
            onChangeText={setCoordinatorName}
            error={fieldErrors.coordinatorName}
          />
          <Input
            label="Coordinator phone number"
            placeholder="Enter Coordinator phone number"
            value={coordinatorPhone}
            onChangeText={setCoordinatorPhone}
            keyboardType="phone-pad"
            error={fieldErrors.coordinatorPhone}
          />

          <Divider spacing={8} />

          <Select
            label="Collaborate Hospital"
            placeholder="Select a hospital"
            value={selectedHospital}
            options={hospitals.map((h) => h.name)}
            onSelect={setSelectedHospital}
            error={fieldErrors.hospitalId}
          />
          <Input
            label="Maximum donor capacity"
            placeholder="50"
            value={maxCapacity}
            onChangeText={setMaxCapacity}
            keyboardType="number-pad"
            error={fieldErrors.maxCapacity}
          />
          <Input
            label="Description"
            placeholder="Optional"
            value={description}
            onChangeText={setDescription}
            error={fieldErrors.description}
          />

          <Button
            label="Create"
            variant="primary"
            onPress={handleCreate}
            style={styles.createButton}
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
  createButton: {
    marginTop: 8,
    width: "100%",
  },
});
