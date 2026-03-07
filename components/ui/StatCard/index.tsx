import { Typo } from "@/components/ui/Typo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { styles } from "./StatCard.styles";
import { StatCardProps } from "./StatCard.types";

export const StatCard = ({
  label,
  value,
  icon,
  accentColor = "#FF3B30",
  style,
}: StatCardProps) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return <Ionicons name={icon as any} size={20} color={accentColor} />;
    }
    return icon;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left colored bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        {icon && <View style={styles.iconWrapper}>{renderIcon()}</View>}
        <Typo variant="h1" style={styles.value}>
          {String(value)}
        </Typo>
        <Typo variant="caption" style={styles.label}>
          {label}
        </Typo>
      </View>
    </View>
  );
};
