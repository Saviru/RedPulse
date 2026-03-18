import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/hooks";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { styles } from "./Toggle.styles";
import { ToggleProps } from "./Toggle.types";

export const Toggle = ({
  value,
  onToggle,
  label,
  disabled = false,
}: ToggleProps) => {
  const { colors, theme } = useThemeColor();

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {label && (
        <Typo variant="body" style={styles.label}>
          {label}
        </Typo>
      )}
      <TouchableOpacity
        style={[
          styles.track,
          { backgroundColor: theme === "dark" ? "#38383A" : "#E5E5EA" },
          value && [styles.trackActive, { backgroundColor: colors.tint }],
        ]} // Changes background from grey to active color when toggled on
        onPress={() => !disabled && onToggle(!value)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        {/* Change thumb to right when active */}
        <View style={[styles.thumb, value && styles.thumbActive]} />
      </TouchableOpacity>
    </View>
  );
};
