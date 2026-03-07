import React from "react";
import { TouchableOpacity, View } from "react-native";

import { styles, variantStyles } from "./Card.styles";
import { CardProps } from "./Card.types";

export const Card = ({
  children,
  style,
  onPress,
  variant = "elevated",
  padding = 16,
}: CardProps) => {
  const variantStyle = variantStyles[variant];

  // wrap the card with TouchableOpacity if an onPress handler is given, otherwise it will be a un-touchable card
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.base, variantStyle, { padding }, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, variantStyle, { padding }, style]}>
      {children}
    </View>
  );
};
