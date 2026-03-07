import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";

export function useThemeColor() {
  const theme = useColorScheme() ?? "light";

  return {
    theme, // 'light' or 'dark'
    colors: Colors[theme],
  };
}
