import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    overflow: "hidden",
  },
});

export const variantStyles = StyleSheet.create({
  elevated: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  outlined: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  filled: {
    backgroundColor: "#F2F2F7",
  },
});
