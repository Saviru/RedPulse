import React from 'react';

const mockColors = {
  text: '#1a1a1a',
  textMuted: '#727577',
  background: '#FFFFFF',
  surface: '#F4F4F5',
  tint: '#FF3B30',
  icon: '#767879',
  border: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
  info: '#007AFF',
};

export function useTheme() {
  return {
    themeMode: 'light' as const,
    theme: 'light' as const,
    colors: mockColors,
    setThemeMode: jest.fn(),
  };
}

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}
