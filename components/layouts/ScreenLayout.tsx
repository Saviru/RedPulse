import { StatusBar, StatusBarStyle } from "expo-status-bar";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  statusBarStyle?: StatusBarStyle;
  backgroundColor?: string;
  padding?: number;
  edges?: ("top" | "bottom" | "left" | "right")[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
}

export const ScreenLayout = ({
  children,
  scrollable = false,
  statusBarStyle = "dark",
  backgroundColor = "#FFFFFF",
  padding = 24,
  edges = ["top", "bottom"],
  style,
  contentContainerStyle,
  footer,
}: ScreenLayoutProps) => {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      // defines device safe areas
      edges={edges}
    >
      <StatusBar style={statusBarStyle} />
      {scrollable ? (
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { padding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          // Safe handling of taps and scrolls when keyboard is open
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.content, { padding }, contentContainerStyle]}>
          {children}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
