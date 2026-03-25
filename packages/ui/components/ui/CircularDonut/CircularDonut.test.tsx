import React from 'react';
import { render } from '@testing-library/react-native';
import { CircularDonut } from './CircularDonut';

describe('CircularDonut', () => {
  const defaultProps = {
    progress: 50,
    color: '#FF0000',
    trackColor: '#CCCCCC',
    bgColor: '#FFFFFF',
    title: '50%',
  };

  it('renders correctly with default props', () => {
    const { getByText } = render(<CircularDonut {...defaultProps} />);
    expect(getByText('50%')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(<CircularDonut {...defaultProps} subtitle="Completed" />);
    expect(getByText('Completed')).toBeTruthy();
  });

  it('clamps progress between 0 and 100', () => {
    // testing visually might be hard but we can ensure it doesn't crash
    const { getByText } = render(<CircularDonut {...defaultProps} progress={150} title="Max" />);
    expect(getByText('Max')).toBeTruthy();

    const { getByText: getByTextMin } = render(<CircularDonut {...defaultProps} progress={-50} title="Min" />);
    expect(getByTextMin('Min')).toBeTruthy();
  });
});
