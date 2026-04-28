import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Platform, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/packages/ui/hooks";
import { styles } from "../Select/Select.styles";
import { DatePickerProps } from "./DatePicker.types";

export const DatePicker = ({
  label,
  value,
  placeholder = "dd/mm/yyyy",
  error,
  disabled = false,
  style,
  onChange,
}: DatePickerProps) => {
  // native calendar visibility state
  const [show, setShow] = useState(false);
  const [webInput, setWebInput] = useState("");
  const [webError, setWebError] = useState<string | null>(null);
  const { colors, theme } = useThemeColor();

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    // Force close calendar
    if (Platform.OS === "android") {
      setShow(false);
    }

    if (selectedDate) {
      onChange(selectedDate);

      if (Platform.OS === "ios") {
        setShow(false);
      }
    }
  };

  const displayValue = value ? value.toLocaleDateString() : "";
  const webDateValue = value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
        value.getDate(),
      ).padStart(2, "0")}`
    : "";

  useEffect(() => {
    if (Platform.OS === "web") {
      setWebInput(webDateValue);
    }
  }, [webDateValue]);

  const parseStrictDate = (raw: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() + 1 !== month ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  };

  const handleWebDateChange = (nextValue: string) => {
    setWebInput(nextValue);
    if (!nextValue) {
      setWebError("Date is required");
      return;
    }
    const parsed = parseStrictDate(nextValue);
    if (!parsed) {
      setWebError("Use YYYY-MM-DD");
      return;
    }
    setWebError(null);
    onChange(parsed);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      )}

      {Platform.OS === "web" ? (
        <View
          style={[
            styles.selectBox,
            {
              backgroundColor: theme === "dark" ? colors.surface : "#F2F2F7",
              borderColor: colors.border,
            },
            !!error &&
              !disabled && [styles.selectBoxError, { borderColor: colors.error }],
            disabled && styles.selectBoxDisabled,
            style,
          ]}
        >
          <TextInput
            value={webInput}
            onChangeText={handleWebDateChange}
            editable={!disabled}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme === "dark" ? "#5C5C5E" : "#8E8E93"}
            style={[styles.valueText, { color: colors.text, paddingVertical: 0 }]}
          />
          <View style={styles.iconRight}>
            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.selectBox,
            {
              backgroundColor: theme === "dark" ? colors.surface : "#F2F2F7",
              borderColor: colors.border,
            },
            !!error &&
              !disabled && [styles.selectBoxError, { borderColor: colors.error }],
            disabled && styles.selectBoxDisabled,
            style,
          ]}
          activeOpacity={0.7}
          onPress={() => setShow(true)}
          disabled={disabled}
        >
          {displayValue ? (
            <Text style={[styles.valueText, { color: colors.text }]}>
              {displayValue}
            </Text>
          ) : (
            <Text
              style={[
                styles.placeholderText,
                { color: theme === "dark" ? "#5C5C5E" : "#8E8E93" },
              ]}
            >
              {placeholder}
            </Text>
          )}

          <View style={styles.iconRight}>
            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
          </View>
        </TouchableOpacity>
      )}

      {show && (
        <DateTimePicker
          value={value || new Date()} // start at today
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          themeVariant={theme}
        />
      )}

      {(error || (Platform.OS === "web" && webError)) && !disabled && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || webError}
        </Text>
      )}
    </View>
  );
};
