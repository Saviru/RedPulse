import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, View } from "react-native";

import { useThemeColor } from "@/packages/ui/theme/useThemeColor";
import { styles } from "./Avatar.styles";
import { AvatarProps } from "./Avatar.types";

export const Avatar = ({
  source,
  size = 64,
  fallbackIcon = "person",
}: AvatarProps) => {
  const { colors } = useThemeColor();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        // applies half of the width as borderRadius
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {/* Shows default icon if no image is provided */}
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <Ionicons name={fallbackIcon} size={size * 0.5} color={colors.icon} />
      )}
    </View>
  );
};
