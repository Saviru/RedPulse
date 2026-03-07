import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

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
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selectBox,
          !!error && !disabled && styles.selectBoxError,
          disabled && styles.selectBoxDisabled,
          style,
        ]}
        activeOpacity={0.7}
        onPress={() => setShow(true)} // Open calendar
        disabled={disabled}
      >
        {displayValue ? (
          <Text style={styles.valueText}>{displayValue}</Text>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}

        <View style={styles.iconRight}>
          <Ionicons name="calendar-outline" size={20} color="#687076" />
        </View>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value || new Date()} // start at today
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}

      {error && !disabled && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
