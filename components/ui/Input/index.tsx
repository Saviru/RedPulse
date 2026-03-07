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
        {label && <Text style={styles.label}>{label}</Text>}

        <View
          style={[
            styles.inputContainer,
            // Focused style
            isFocused && !disabled && styles.inputContainerFocused,
            // Error Style
            !!error && !disabled && styles.inputContainerError,
            disabled && styles.inputContainerDisabled,
            containerStyle,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#8E8E93"
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            {...rest}
          />

          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>

        {error && !disabled && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

Input.displayName = "Input";
