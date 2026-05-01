import React from 'react';
import { Text } from 'react-native';

// Mock resend (and its svix dependency) to prevent ESM parse errors in tests
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    },
  })),
}));

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
