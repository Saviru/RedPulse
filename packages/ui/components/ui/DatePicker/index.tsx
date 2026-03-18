import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

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

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      )}

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
        onPress={() => setShow(true)} // Open calendar
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

      {show && (
        <DateTimePicker
          value={value || new Date()} // start at today
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          themeVariant={theme}
        />
      )}

      {error && !disabled && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};
