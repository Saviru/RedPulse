import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E5E5EA",
    padding: 2,
    justifyContent: "center",
  },
  trackActive: {
    backgroundColor: "#FF3B30",
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  thumbActive: {
    alignSelf: "flex-end",
  },
});
