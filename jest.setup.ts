import React from 'react';
import { Text } from 'react-native';

// Mock all expo-vector-icons to prevent async font loading and act(...) warnings
const mockIcon = (name: string) => {
  return ({ name: iconName, size, color }: any) => {
    return React.createElement(Text, { testID: `${name}-${iconName}` }, iconName);
  };
};

jest.mock('@expo/vector-icons', () => ({
  Ionicons: mockIcon('Ionicons'),
  MaterialIcons: mockIcon('MaterialIcons'),
  FontAwesome: mockIcon('FontAwesome'),
  MaterialCommunityIcons: mockIcon('MaterialCommunityIcons'),
  Entypo: mockIcon('Entypo'),
  Feather: mockIcon('Feather'),
  AntDesign: mockIcon('AntDesign'),
}));

jest.mock('@expo/vector-icons/Ionicons', () => mockIcon('Ionicons'));
jest.mock('@expo/vector-icons/MaterialIcons', () => mockIcon('MaterialIcons'));
jest.mock('@expo/vector-icons/FontAwesome', () => mockIcon('FontAwesome'));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => mockIcon('MaterialCommunityIcons'));
