import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/packages/ui/hooks';
import { Typo } from '../Typo';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.tabBar, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12), // Safe area logic for bottom padding
        }
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        // Custom prop mapped in our layout configuration
        const iconName = (options as any).tabBarIconName || 'circle';

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={iconName as any}
                size={24}
                color={isFocused ? colors.tint : colors.icon}
              />
            </View>
            <Typo
              variant="caption"
              style={[
                styles.tabLabel, 
                { 
                  color: isFocused ? colors.tint : colors.textMuted, 
                  fontWeight: '500' // Medium equivalent
                }
              ]}
            >
              {label as string}
            </Typo>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 68,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 8, // Native flex gap alternative (for gap-2 Tailwind)
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4, // Tight gap between icon and text (gap-1)
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.15, // 0.015em 
    marginTop: 2, // Slight offset for non-gap environments like older RN bounds
  },
});
