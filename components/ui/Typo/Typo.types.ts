import { TextProps } from 'react-native';

export interface TypoProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  color?: string; // Optional override
}