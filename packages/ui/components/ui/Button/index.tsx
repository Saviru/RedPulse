import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

import { styles } from "./Button.styles";
import { ButtonProps } from "./Button.types";

import { useThemeColor } from "@/packages/ui/theme/useThemeColor";

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
  const { theme, colors } = useThemeColor();

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          container: {
            backgroundColor: colors.surface,
          },
          text: { color: colors.text },
        };
      case "danger":
        return {
          container: {
            backgroundColor:
              theme === "dark"
                ? "rgba(255, 69, 58, 0.15)"
                : "rgba(255, 59, 48, 0.1)",
            borderWidth: 1,
            borderColor:
              theme === "dark"
                ? "rgba(255, 69, 58, 0.3)"
                : "rgba(255, 59, 48, 0.3)",
          },
          text: { color: colors.error },
        };
      case "primary":
      default:
        return {
          container: { backgroundColor: colors.tint },
          text: { color: "#FFFFFF" },
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderIcon = (iconNode: React.ReactNode) => {
    if (!React.isValidElement(iconNode)) return iconNode;
    // Clone the icon to inject the appropriate text color so it matches the theme
    return React.cloneElement(iconNode as React.ReactElement<any>, {
      color: variantStyles.text.color,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      // If loading, hide the text and icon, just show the spinner
      return <ActivityIndicator color={variantStyles.text.color} />;
    }

    return (
      <>
        {/* icon before the text */}
        {icon && iconPosition === "left" && renderIcon(icon)}

        <Text style={[styles.baseText, variantStyles.text]}>{label}</Text>

        {/* icon after the text */}
        {icon && iconPosition === "right" && renderIcon(icon)}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        variantStyles.container,
        disabled && styles.disabledContainer,
        style,
        bgColor && { backgroundColor: bgColor },
      ]}
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
