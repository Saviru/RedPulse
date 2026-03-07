import { Typo } from "@/components/ui/Typo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import { styles } from "./ListItem.styles";
import { ListItemProps } from "./ListItem.types";

export const ListItem = ({
  title,
  subtitle,
  leftIcon,
  leftIconColor = "#FF3B30",
  rightIcon = "chevron-forward",
  onPress,
  style,
}: ListItemProps) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      // Gives visual feedback on press and disables interaction if no onPress handler is provided
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {leftIcon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: leftIconColor + "15",
            } /* adds a 8-10% opacity to the base hex color of the icon */,
          ]}
        >
          <Ionicons name={leftIcon} size={20} color={leftIconColor} />
        </View>
      )}
      <View style={styles.content}>
        <Typo variant="body" style={styles.title}>
          {title}
        </Typo>
        {subtitle && (
          <Typo variant="caption" style={styles.subtitle}>
            {subtitle}
          </Typo>
        )}
      </View>
      {onPress && <Ionicons name={rightIcon} size={20} color="#C7C7CC" />}
    </TouchableOpacity>
  );
};
