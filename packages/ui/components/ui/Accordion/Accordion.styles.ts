import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    paddingRight: 16,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
});
