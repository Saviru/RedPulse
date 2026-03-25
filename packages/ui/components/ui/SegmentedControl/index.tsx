import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { styles } from "./SegmentedControl.styles";
import { SegmentedControlProps } from "./SegmentedControl.types";
import { useThemeColor } from "@/packages/ui/hooks";

export const SegmentedControl = ({
  options,
  selectedIndex,
  onChange,
  style,
}: SegmentedControlProps) => {
  const { theme, colors } = useThemeColor();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? "#2C2C2E" : "#E5E5EA" },
        style,
      ]}
    >
      {options.map((option, index) => {
        const isActive = selectedIndex === index;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: isActive
                  ? colors.tint // Red for active
                  : "transparent",
              },
            ]}
            onPress={() => onChange(index)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.text,
                { color: isActive ? "#FFFFFF" : colors.text },
              ]}
              numberOfLines={1}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
