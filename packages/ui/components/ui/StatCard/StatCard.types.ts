import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';

export interface StatCardProps {
  label: string;
  value: string | number | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: string | React.ReactNode;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}
