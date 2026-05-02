import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  leftIconColor?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}
