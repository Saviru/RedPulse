import { TextInputProps, ViewStyle, StyleProp } from 'react-native';
import React from 'react';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}