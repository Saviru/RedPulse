import { useThemeColor } from "@/packages/ui/hooks";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Modal, Pressable, Platform } from "react-native";
import { Typo } from "../Typo";
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
    <View 
      style={[
        styles.container, 
        style, 
        { zIndex: isOpen ? 9999 : 1, elevation: isOpen ? 100 : 0 }
      ]}
    >
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

      {/* The Modal-based Dropdown Menu */}
      <Modal
        visible={isOpen && options.length > 0}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsOpen(false)}
        >
          <View 
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typo variant="body" style={{ fontWeight: "bold" }}>{label || placeholder}</Typo>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.optionsList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
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
        </Pressable>
      </Modal>

      {error && !disabled && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};
