import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode | string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}
