import { StyleSheet } from "react-native";

export const variantColors = {
  default: { bg: "#F2F2F7", text: "#11181C" },
  success: { bg: "#E8F5E9", text: "#2E7D32" },
  warning: { bg: "#FFF3E0", text: "#E65100" },
  danger: { bg: "#FFEBEE", text: "#C62828" },
  info: { bg: "#E3F2FD", text: "#1565C0" },
};

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    // Prevents from stretching to fill the entire width of its parent container
    alignSelf: "flex-start",
  },
});
