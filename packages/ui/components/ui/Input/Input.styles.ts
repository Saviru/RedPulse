import { StyleSheet } from "react-native";

const theme = {
  colors: {
    border: "#E5E5EA",
    borderFocused: "#000000",
    borderError: "#FF3B30",
    background: "#ffffff",
    text: "#11181C",
    label: "#687076",
  },
  borderRadius: 8,
};

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.label,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputContainerDisabled: {
    backgroundColor: "#F2F2F7",
    opacity: 0.5,
  },
  // Dynamic states
  inputContainerFocused: {
    borderColor: theme.colors.borderFocused,
    backgroundColor: "#FFFFFF",
  },
  inputContainerError: {
    borderColor: theme.colors.borderError,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.borderError,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
