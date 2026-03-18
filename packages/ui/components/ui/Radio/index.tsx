import React from "react";
import { TouchableOpacity, View } from "react-native";

import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/hooks";

import { styles } from "./Radio.styles";
import { RadioProps } from "./Radio.types";

export const Radio = ({
  selected,
  onSelect,
  label,
  disabled = false,
}: RadioProps) => {
  const { colors } = useThemeColor();

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      // checks for disable state before executing the selection
      onPress={() => !disabled && onSelect()}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View
        style={[
          styles.circle,
          { borderColor: colors.border, backgroundColor: colors.background },
          selected && [styles.circleSelected, { borderColor: colors.tint }],
        ]}
      >
        {selected && (
          <View style={[styles.dot, { backgroundColor: colors.tint }]} />
        )}
      </View>
      {label && (
        <Typo variant="body" style={styles.label}>
          {label}
        </Typo>
      )}
    </TouchableOpacity>
  );
};
