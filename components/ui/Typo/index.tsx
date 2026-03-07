import React from "react";
import { Text } from "react-native";
import { styles } from "./Typo.styles";
import { TypoProps } from "./Typo.types";

export const Typo = ({
  variant = "body",
  align = "left",

  color = "#11181C",
  style,
  children,
  ...rest
}: TypoProps) => {
  // visual properties (font-size, line-height, and font-weight)
  const variantStyle = styles[variant];

  return (
    <Text
      style={[
        variantStyle,
        { textAlign: align, color: color }, // Overrides default text color and alignment
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
