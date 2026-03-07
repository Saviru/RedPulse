import { ViewStyle } from 'react-native';

export interface DatePickerProps {
  label?: string;
  value?: Date;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  onChange: (date: Date) => void;
}