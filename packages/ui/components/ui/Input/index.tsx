import { useThemeColor } from "@/packages/ui/theme/useThemeColor";
import React, { forwardRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { styles } from "./Input.styles";
import { InputProps } from "./Input.types";

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      disabled = false,
      style,
      onFocus,
      onBlur,
      containerStyle,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const { theme, colors } = useThemeColor();

    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.background, borderColor: colors.border },
            // Focused style
            isFocused &&
              !disabled && [
                styles.inputContainerFocused,
                {
                  borderColor: colors.text,
                  backgroundColor: colors.background,
                },
              ],
            // Error Style
            !!error &&
              !disabled && [
                styles.inputContainerError,
                { borderColor: colors.error },
              ],
            disabled && [
              styles.inputContainerDisabled,
              {
                backgroundColor: theme === "dark" ? colors.surface : "#F2F2F7",
                opacity: 0.7,
              },
            ],
            containerStyle,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style]}
            placeholderTextColor={theme === "dark" ? "#5C5C5E" : "#8E8E93"}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            {...rest}
          />

          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>

        {error && !disabled && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
