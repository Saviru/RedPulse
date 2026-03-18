import React from "react";
import { TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/packages/ui/theme/useThemeColor";
import { styles, variantStyles } from "./Card.styles";
import { CardProps } from "./Card.types";

export const Card = ({
  children,
  style,
  onPress,
  variant = "elevated",
  padding = 16,
}: CardProps) => {
  const { theme, colors } = useThemeColor();

  const getVariantStyles = () => {
    switch (variant) {
      case "outlined":
        return [
          variantStyles.outlined,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ];
      case "filled":
        return [
          variantStyles.filled,
          { backgroundColor: theme === "dark" ? colors.surface : "#F2F2F7" },
        ];
      case "elevated":
      default:
        return [
          variantStyles.elevated,
          {
            backgroundColor: theme === "dark" ? colors.surface : "#FFFFFF",
            shadowColor: theme === "dark" ? "#5a5a5a" : "#3f3f3f",
            shadowOpacity: 0.08,
          },
        ];
    }
  };

  const dynamicStyle = getVariantStyles();

  // wrap the card with TouchableOpacity if an onPress handler is given, otherwise it will be a un-touchable card
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.base, dynamicStyle, { padding }, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, dynamicStyle, { padding }, style]}>
      {children}
    </View>
  );
};
