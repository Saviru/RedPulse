import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/hooks";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { styles } from "./StatCard.styles";
import { StatCardProps } from "./StatCard.types";

export const StatCard = ({
  label,
  value,
  icon,
  accentColor,
  style,
}: StatCardProps) => {
  const { colors, theme } = useThemeColor();
  const activeAccentColor = accentColor || colors.tint;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return (
        <Ionicons name={icon as any} size={20} color={activeAccentColor} />
      );
    }
    return icon;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? colors.surface : "#FFFFFF" },
        style,
      ]}
    >
      {/* Left colored bar */}
      <View
        style={[styles.accentBar, { backgroundColor: activeAccentColor }]}
      />
      <View style={styles.content}>
        {icon && <View style={styles.iconWrapper}>{renderIcon()}</View>}
        <Typo variant="h1" style={[styles.value, { color: colors.text }]}>
          {String(value)}
        </Typo>
        <Typo
          variant="caption"
          style={[styles.label, { color: colors.textMuted }]}
        >
          {label}
        </Typo>
      </View>
    </View>
  );
};
