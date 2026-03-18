import { Colors } from "@/packages/ui/theme/colors";
import { useColorScheme } from "react-native";

export function useThemeColor() {
  const theme = useColorScheme() ?? "light";

  return {
    theme, // 'light' or 'dark'
    colors: Colors[theme],
  };
}
