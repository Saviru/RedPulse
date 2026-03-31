import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { CustomTabBar } from './CustomTabBar';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

const mockTabBarOffset = new Animated.Value(0);
jest.mock('../../../context/ScrollContext', () => ({
  useScroll: () => ({
    tabBarOffset: mockTabBarOffset,
  }),
}));

jest.mock('@/packages/ui/hooks', () => ({
  useThemeColor: () => ({
    colors: {
      surface: '#ffffff',
      border: '#eeeeee',
      tint: '#ff0000',
      icon: '#888888',
      textMuted: '#aaaaaa',
    },
    theme: 'light',
  }),
}));


describe('CustomTabBar', () => {
  const mockNavigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  };

  const mockState = {
    index: 0,
    routes: [
      { key: 'route1', name: 'Home' },
      { key: 'route2', name: 'Profile' },
    ],
  };

  const mockDescriptors = {
    route1: {
      options: {
        tabBarLabel: 'Home Tab',
        tabBarIconName: 'home',
      },
    },
    route2: {
      options: {
        title: 'Profile Title',
        tabBarIconName: 'person',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    return render(
      <CustomTabBar
        state={mockState as any}
        descriptors={mockDescriptors as any}
        navigation={mockNavigation as any}
        insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
      />
    );
  };

  it('renders tabs correctly based on state and descriptors', () => {
    const { getByText, getByRole } = setup();

    expect(getByText('Home Tab')).toBeTruthy();
    expect(getByText('Profile Title')).toBeTruthy();
  });

  it('calls navigation.emit and navigation.navigate on tab press', () => {
    const { getByText } = setup();

    // Press the second tab
    const profileTab = getByText('Profile Title');
    fireEvent.press(profileTab);

    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'route2',
      canPreventDefault: true,
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile', undefined);
  });

  it('does not call navigate if event default is prevented', () => {
    mockNavigation.emit.mockReturnValueOnce({ defaultPrevented: true } as any);
    
    const { getByText } = setup();
    const profileTab = getByText('Profile Title');
    fireEvent.press(profileTab);

    expect(mockNavigation.emit).toHaveBeenCalled();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('does not call navigate if tab is already focused', () => {
    const { getByText } = setup();
    
    // index is 0, so Home is focused
    const homeTab = getByText('Home Tab');
    fireEvent.press(homeTab);

    expect(mockNavigation.emit).toHaveBeenCalled();
    // navigate should not be called because it's already focused
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
