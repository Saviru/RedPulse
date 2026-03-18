import { TouchableOpacityProps } from 'react-native';
import React from 'react';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode; 
  iconPosition?: 'left' | 'right'; 
  bgColor?: string;
}