import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, ColorSchemeName } from "react-native";
import { Colors } from "../constants/colors";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: "light" | "dark";
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  // Resolve the actual theme ('light' or 'dark')
  const theme = themeMode === "system" 
    ? (systemColorScheme ?? "light") 
    : themeMode;

  const value = {
    themeMode,
    theme,
    colors: Colors[theme],
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
