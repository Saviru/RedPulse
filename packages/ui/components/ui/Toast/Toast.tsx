import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: (id: string) => void;
  persistent?: boolean;
}

export function Toast({
  id,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  persistent = false,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 15 });

    if (!persistent) {
      const timer = setTimeout(() => {
        handleHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleHide = () => {
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(-50, { duration: 300 }, () => {
      runOnJS(onHide)(id);
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10b981'; // green-500
      case 'error':
        return '#ef4444'; // red-500
      case 'warning':
        return '#f59e0b'; // amber-500
      case 'info':
      default:
        return '#3b82f6'; // blue-500
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error-outline';
      case 'warning':
        return 'warning-amber';
      case 'info':
      default:
        return 'info-outline';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: getBackgroundColor(),
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name={getIcon()} size={24} color="#ffffff" />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
      {!persistent && (
        <TouchableOpacity onPress={handleHide} style={styles.closeButton}>
          <MaterialIcons name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
    flexShrink: 1,
  },
  closeButton: {
    padding: 4,
  },
});
