import { Typo } from "@/components/ui/Typo";
import React from "react";
import { View } from "react-native";

import { styles, variantColors } from "./Badge.styles";
import { BadgeProps } from "./Badge.types";

export const Badge = ({ label, variant = "default" }: BadgeProps) => {
  // check background and text colors from the predefined variant mappings
  const colors = variantColors[variant];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Typo variant="caption" style={{ color: colors.text, fontWeight: "600" }}>
        {label}
      </Typo>
    </View>
  );
};
