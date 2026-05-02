import React from "react";
import { View, StyleSheet } from "react-native";
import { Typo } from "../Typo";

interface CircularDonutProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  bgColor: string;
  title: string;
  subtitle?: string;
  titleVariant?: "caption" | "body" | "h1" | "h2";
}

export const CircularDonut = ({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor,
  bgColor,
  title,
  subtitle,
  titleVariant = "h2"
}: CircularDonutProps) => {
  const radius = size / 2;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Right mask rotates from 0 to 180 covering the first 50%
  const rightRotate = Math.min(clampedProgress, 50) * 3.6;
  // Left mask rotates from 0 to 180 covering 51% to 100%
  const leftRotate = Math.max(clampedProgress - 50, 0) * 3.6;

  return (
    <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: trackColor, overflow: "hidden" }]}>
      {/* Base Colored Circle */}
      <View style={{ position: "absolute", width: size, height: size, borderRadius: radius, backgroundColor: color }} />
      
      {/* Right Mask */}
      <View style={{ position: "absolute", width: radius, height: size, left: radius, overflow: "hidden" }}>
        <View
          style={{
            width: radius,
            height: size,
            backgroundColor: trackColor,
            transform: [{ translateX: -radius / 2 }, { rotate: `${rightRotate}deg` }, { translateX: radius / 2 }]
          }}
        />
      </View>

      {/* Left Mask */}
      <View style={{ position: "absolute", width: radius, height: size, left: 0, overflow: "hidden" }}>
        <View
          style={{
            width: radius,
            height: size,
            backgroundColor: trackColor,
            transform: [{ translateX: radius / 2 }, { rotate: `${leftRotate}deg` }, { translateX: -radius / 2 }]
          }}
        />
      </View>

      {/* Inner Hole */}
      <View
        style={{
          position: "absolute",
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: radius - strokeWidth,
          backgroundColor: bgColor,
          left: strokeWidth,
          top: strokeWidth,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Typo variant={titleVariant} style={{ color, fontWeight: "bold" }}>
          {title}
        </Typo>
        {subtitle && (
          <Typo variant="caption" color={trackColor === "#E5E5EA" ? "#666" : "#888"} style={{ fontSize: size > 80 ? 12 : 10 }}>
            {subtitle}
          </Typo>
        )}
      </View>
    </View>
  );
};
