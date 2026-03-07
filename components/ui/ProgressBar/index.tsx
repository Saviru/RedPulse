import React from "react";
import { View } from "react-native";

import { Typo } from "@/components/ui/Typo";
import { styles } from "./ProgressBar.styles";
import { ProgressBarProps } from "./ProgressBar.types";

export const ProgressBar = ({
  progress,
  label,
  color = "#FF3B30",
  style,
}: ProgressBarProps) => {
  // Limit values to the 0-1 range 0=0% and 1=100%
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Typo variant="caption" style={styles.label}>
            {label}
          </Typo>
          <Typo variant="caption" style={styles.percentage}>
            {Math.round(clampedProgress * 100)}%
          </Typo>
        </View>
      )}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clampedProgress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};
