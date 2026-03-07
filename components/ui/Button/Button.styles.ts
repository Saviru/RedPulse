import { StyleSheet } from "react-native";

const theme = {
  colors: {
    primary: "#FF3B30",
    primaryText: "#FFFFFF",
    secondary: "#E5E5EA",
    secondaryText: "#1C1C1E",
    danger: "#000000",
    dangerText: "#FFFFFF",
    disabled: "#D1D1D6",
  },
  spacing: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  borderRadius: 8,
};

export const styles = StyleSheet.create({
  // --- BASE STYLES ---
  baseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.paddingVertical,
    paddingHorizontal: theme.spacing.paddingHorizontal,
    borderRadius: theme.borderRadius,
    minHeight: 48,
    gap: 8,
  },
  baseText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Variant styles
  primaryContainer: {
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: theme.colors.primaryText,
  },

  secondaryContainer: {
    backgroundColor: theme.colors.secondary,
  },
  secondaryText: {
    color: theme.colors.secondaryText,
  },

  dangerContainer: {
    backgroundColor: theme.colors.danger,
  },
  dangerText: {
    color: theme.colors.dangerText,
  },

  // state styles
  disabledContainer: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.7,
  },
});
