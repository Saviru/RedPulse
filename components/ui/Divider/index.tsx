import React from "react";
import { View } from "react-native";
import { styles } from "./Divider.styles";
import { DividerProps } from "./Divider.types";

export const Divider = ({ spacing = 16, color = "#F2F2F7" }: DividerProps) => {
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: color, marginVertical: spacing },
      ]}
    />
  );
};
