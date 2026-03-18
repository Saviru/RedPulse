import { Ionicons } from "@expo/vector-icons";
import { ImageSourcePropType } from "react-native";

export interface AvatarProps {
  source?: ImageSourcePropType;
  size?: number;
  // Extracts valid icon names from Ionicons to provide strict typescript autocompletion
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}
