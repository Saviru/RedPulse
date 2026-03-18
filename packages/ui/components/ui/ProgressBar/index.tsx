import React from "react";
import { View } from "react-native";

import { Typo } from "@/packages/ui/components/ui/Typo";
import { useThemeColor } from "@/packages/ui/theme/useThemeColor";
import { styles } from "./ProgressBar.styles";
import { ProgressBarProps } from "./ProgressBar.types";

export const ProgressBar = ({
  progress,
  label,
  color,
  style,
}: ProgressBarProps) => {
  const { colors, theme } = useThemeColor();
  // Limit values to the 0-1 range 0=0% and 1=100%
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Typo
            variant="caption"
            style={[styles.label, { color: colors.textMuted }]}
          >
            {label}
          </Typo>
          <Typo
            variant="caption"
            style={[styles.percentage, { color: colors.text }]}
          >
            {Math.round(clampedProgress * 100)}%
          </Typo>
        </View>
      )}
      <View
        style={[
          styles.track,
          { backgroundColor: theme === "dark" ? colors.surface : "#F2F2F7" },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress * 100}%`,
              backgroundColor: color || colors.tint,
            },
          ]}
        />
      </View>
    </View>
  );
};
