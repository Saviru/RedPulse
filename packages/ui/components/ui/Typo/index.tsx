import { useThemeColor } from "@/packages/ui/hooks/useThemeColor";
import React from "react";
import { Text } from "react-native";
import { styles } from "./Typo.styles";
import { TypoProps } from "./Typo.types";

export const Typo = ({
  variant = "body",
  align = "left",
  color,
  style,
  children,
  ...rest
}: TypoProps) => {
  const { colors } = useThemeColor();

  // visual properties (font-size, line-height, and font-weight)
  const variantStyle = styles[variant];

  // Default color logic depending on variant if needed, or simply themed text color
  const defaultColor = variant === "caption" ? colors.textMuted : colors.text;

  return (
    <Text
      style={[
        variantStyle,
        { textAlign: align, color: color || defaultColor }, // Overrides default text color and alignment
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
