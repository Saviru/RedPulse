import React from 'react';
import { ViewStyle } from 'react-native';

export interface SelectProps {
  label?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  options?: string[]; 
  onSelect?: (value: string) => void;
}