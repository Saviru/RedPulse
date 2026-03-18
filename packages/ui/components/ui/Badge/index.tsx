import { Typo } from "@/packages/ui/components/ui/Typo";
import React from "react";
import { View } from "react-native";

import { useThemeColor } from "@/packages/ui/hooks";
import { styles } from "./Badge.styles";
import { BadgeProps } from "./Badge.types";

export const Badge = ({ label, variant = "default" }: BadgeProps) => {
  const { theme, colors } = useThemeColor();

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          bg: theme === "dark" ? "rgba(52, 199, 89, 0.15)" : "#E8F5E9",
          text: colors.success,
        };
      case "warning":
        return {
          bg: theme === "dark" ? "rgba(255, 149, 0, 0.15)" : "#FFF3E0",
          text: theme === "dark" ? "#FF9F0A" : "#E65100",
        };
      case "danger":
        return {
          bg: theme === "dark" ? "rgba(255, 69, 58, 0.15)" : "#FFEBEE",
          text: colors.error,
        };
      case "info":
        return {
          bg: theme === "dark" ? "rgba(10, 132, 255, 0.15)" : "#E3F2FD",
          text: theme === "dark" ? "#5E5CE6" : "#1565C0",
        };
      case "default":
      default:
        return {
          bg: theme === "dark" ? colors.surface : "#F2F2F7",
          text: colors.text,
        };
    }
  };

  const variantColors = getVariantStyles();

  return (
    <View style={[styles.container, { backgroundColor: variantColors.bg }]}>
      <Typo
        variant="caption"
        style={{ color: variantColors.text, fontWeight: "600" }}
      >
        {label}
      </Typo>
    </View>
  );
};
