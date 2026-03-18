import { ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}
