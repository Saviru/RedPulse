import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    overflow: "hidden",
  },
});

export const variantStyles = StyleSheet.create({
  elevated: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
