import React from "react";
import { TouchableOpacity, View } from "react-native";

import { Typo } from "@/components/ui/Typo";

import { styles } from "./Radio.styles";
import { RadioProps } from "./Radio.types";

export const Radio = ({
  selected,
  onSelect,
  label,
  disabled = false,
}: RadioProps) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      // checks for disable state before executing the selection
      onPress={() => !disabled && onSelect()}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.circle, selected && styles.circleSelected]}>
        {selected && <View style={styles.dot} />}
      </View>
      {label && (
        <Typo variant="body" style={styles.label}>
          {label}
        </Typo>
      )}
    </TouchableOpacity>
  );
};
