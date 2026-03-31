import { Typo } from "../Typo";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/packages/ui/hooks";
import { styles } from "./Checkbox.styles";
import { CheckboxProps } from "./Checkbox.types";

export const Checkbox = ({
  checked,
  onToggle,
  label,
  disabled = false,
}: CheckboxProps) => {
  const { colors } = useThemeColor();

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      // only pass the value if checkbox is enabled
      onPress={() => !disabled && onToggle(!checked)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {/* frame changes color when checked */}
      <View
        style={[
          styles.box,
          { borderColor: colors.border, backgroundColor: colors.background },
          checked && [
            styles.boxChecked,
            { backgroundColor: colors.tint, borderColor: colors.tint },
          ],
        ]}
      >
        {checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
      {label && (
        <Typo variant="body" style={styles.label}>
          {label}
        </Typo>
      )}
    </TouchableOpacity>
  );
};
