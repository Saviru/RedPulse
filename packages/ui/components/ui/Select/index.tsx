import { useThemeColor } from "@/packages/ui/theme/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./Select.styles";
import { SelectProps } from "./Select.types";

export const Select = ({
  label,
  value,
  placeholder = "Select an option",
  error,
  disabled = false,
  leftIcon,
  style,
  options = [],
  onSelect,
}: SelectProps) => {
  // Track dropdown visibility
  const [isOpen, setIsOpen] = useState(false);
  const { theme, colors } = useThemeColor();

  // Handle option selection
  const handleSelect = (option: string) => {
    if (onSelect) onSelect(option); // Pass selection to parent
    setIsOpen(false);
  };

  return (
    // zIndex to ensure dropdown overlaps other elements
    <View style={[styles.container, style, { zIndex: isOpen ? 1000 : 1 }]}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      )}

      <View style={{ position: "relative", zIndex: isOpen ? 1000 : 1 }}>
        <TouchableOpacity
          style={[
            styles.selectBox,
            {
              backgroundColor: theme === "dark" ? colors.surface : "#F2F2F7",
              borderColor: colors.border,
            },
            !!error &&
              !disabled && [
                styles.selectBoxError,
                { borderColor: colors.error },
              ],
            disabled && styles.selectBoxDisabled,
          ]}
          activeOpacity={0.7}
          onPress={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          {value ? (
            <Text style={[styles.valueText, { color: colors.text }]}>
              {value}
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
            {/* Flips the chevron arrow based on open/closed state */}
            <Ionicons
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.icon}
            />
          </View>
        </TouchableOpacity>

        {/* The Floating Dropdown Menu */}
        {isOpen && options.length > 0 && (
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView nestedScrollEnabled={true}>
              {options.map((option, index) => {
                const isSelected = value === option;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        isSelected && [
                          styles.optionTextSelected,
                          { color: colors.tint },
                        ],
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {error && !disabled && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};
