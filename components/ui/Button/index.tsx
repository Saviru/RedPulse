import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

import { styles } from "./Button.styles";
import { ButtonProps } from "./Button.types";

export const Button = ({
  label,
  variant = "primary",
  isLoading = false,
  icon,
  iconPosition = "left",
  style,
  bgColor,
  disabled,
  ...rest
}: ButtonProps) => {
  const buttonStyle = styles[`${variant}Container`];
  const textStyle = styles[`${variant}Text`];

  const renderContent = () => {
    if (isLoading) {
      // If loading, hide the text and icon, just show the spinner
      return <ActivityIndicator color={textStyle.color} />;
    }

    return (
      <>
        {/* icon before the text */}
        {icon && iconPosition === "left" && icon}

        <Text style={[styles.baseText, textStyle]}>{label}</Text>

        {/* icon after the text */}
        {icon && iconPosition === "right" && icon}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.baseContainer, buttonStyle, style]}
      // make the button diabled if loading or defined as disabled
      disabled={isLoading || disabled}
      // Click animation opacity
      activeOpacity={0.8}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
