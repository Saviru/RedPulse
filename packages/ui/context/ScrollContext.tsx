import React, { createContext, useContext, useRef, useCallback } from "react";
import { Animated } from "react-native";

interface ScrollContextType {
  tabBarOffset: Animated.Value;
  handleScroll: (event: any) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tabBarOffset = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // Hiding tab bar on scroll down (> 0)
    // Showing tab bar on scroll up (< 0)
    if (diff > 10 && currentScrollY > 50) {
      // Scrolling down
      Animated.timing(tabBarOffset, {
        toValue: 100, // Hide threshold
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (diff < -10) {
      // Scrolling up
      Animated.timing(tabBarOffset, {
        toValue: 0, // Show threshold
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentScrollY;
  }, [tabBarOffset]);

  return (
    <ScrollContext.Provider value={{ tabBarOffset, handleScroll }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScroll must be used within a ScrollProvider");
  }
  return context;
};
