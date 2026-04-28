import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/packages/ui/hooks';
import { Typo } from '../Typo';
import { useScroll } from '../../../context/ScrollContext';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const { tabBarOffset } = useScroll();

  return (
    <Animated.View 
      style={[
        styles.tabBar, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
          transform: [{ translateY: tabBarOffset }],
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
            <Animated.View style={styles.iconContainer}>
              <MaterialIcons
                name={iconName as any}
                size={24}
                color={isFocused ? colors.tint : colors.icon}
              />
            </Animated.View>
            <Typo
              variant="caption"
              style={[
                styles.tabLabel, 
                { 
                  color: isFocused ? colors.tint : colors.textMuted, 
                  fontWeight: '500'
                }
              ]}
            >
              {label as string}
            </Typo>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 68,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.15,
    marginTop: 2,
  },
});
