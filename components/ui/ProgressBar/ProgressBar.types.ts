import { ViewStyle, StyleProp } from 'react-native';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}
