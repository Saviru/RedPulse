import { useThemeColor } from "@/packages/ui/hooks";
import React from "react";
import { View } from "react-native";
import { styles } from "./Divider.styles";
import { DividerProps } from "./Divider.types";

export const Divider = ({ spacing = 16, color }: DividerProps) => {
  const { colors } = useThemeColor();

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: color || colors.border, marginVertical: spacing },
      ]}
    />
  );
};
