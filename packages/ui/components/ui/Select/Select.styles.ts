import { StyleSheet } from "react-native";

const theme = {
  colors: {
    border: "#E5E5EA",
    background: "#F2F2F7",
    text: "#11181C",
    placeholder: "#8E8E93",
    label: "#687076",
    error: "#FF3B30",
  },
  borderRadius: 8,
};

export const styles = StyleSheet.create({
  container: { width: "100%", marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.label,
    marginBottom: 6,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  selectBoxDisabled: { opacity: 0.5 },
  selectBoxError: { borderColor: theme.colors.error },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  valueText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.placeholder,
    paddingVertical: 12,
  },
  errorText: { fontSize: 12, color: theme.colors.error, marginTop: 6 },

  // Styles for the floating dropdown menu
  dropdownMenu: {
    position: "absolute",
    top: "100%", // Pushes it exactly below the input box
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
    marginTop: 4,
    maxHeight: 200, // Prevents the list from going off screen
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: "700",
    color: "#FF3B30",
  },
});
