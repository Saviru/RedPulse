import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, View } from "react-native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo } from "../Typo";
import { styles } from "./Avatar.styles";
import { AvatarProps } from "./Avatar.types";

export const Avatar = ({
  source,
  size = 64,
  fallbackIcon = "person",
  fallbackText,
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
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : fallbackText ? (
        <Typo variant="body" style={{ color: colors.tint, fontWeight: "bold", fontSize: size * 0.4 }}>
          {fallbackText}
        </Typo>
      ) : (
        <Ionicons name={fallbackIcon} size={size * 0.5} color={colors.icon} />
      )}
    </View>
  );
};
