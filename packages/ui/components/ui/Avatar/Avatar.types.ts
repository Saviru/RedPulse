import { Ionicons } from "@expo/vector-icons";
import { ImageSourcePropType } from "react-native";

export interface AvatarProps {
  /** Size of the avatar */
  size?: number;
  /** Image source */
  source?: ImageSourcePropType;
  /** Fallback icon name to show when image fails or isn't provided */
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  /** Fallback text to show (e.g. initials) when image isn't provided. Takes precedence over fallbackIcon */
  fallbackText?: string;
}
