import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColor } from "../../../hooks";
import { Typo } from "../Typo";

export interface AnimatedHeaderProps {
  title: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  scrollY: Animated.Value;
  headerHeight?: number;
}

export const AnimatedHeader = ({
  title,
  leftElement,
  rightElement,
  scrollY,
  headerHeight = 64,
}: AnimatedHeaderProps) => {
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets();

  const clampedScroll = Animated.diffClamp(
    scrollY,
    0,
    headerHeight + insets.top
  );

  const headerTranslate = clampedScroll.interpolate({
    inputRange: [0, headerHeight + insets.top],
    outputRange: [0, -(headerHeight + insets.top)],
  });

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          height: headerHeight + insets.top,
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          transform: [{ translateY: headerTranslate }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContainer}>{leftElement}</View>
        <Typo variant="h2" style={styles.title}>
          {title}
        </Typo>
        <View style={styles.rightContainer}>{rightElement}</View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  leftContainer: {
    width: 40,
    alignItems: "flex-start",
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
