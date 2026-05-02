import { useTheme } from "../context/ThemeContext";

export function useThemeColor() {
  const { theme, colors, setThemeMode, themeMode } = useTheme();

  return {
    theme, // 'light' or 'dark'
    colors,
    setThemeMode,
    themeMode,
  };
}
