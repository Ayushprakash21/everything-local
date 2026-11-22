import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface ELLogoProps {
  variant?: 'dark' | 'light' | 'full' | 'icon';
  size?: number;
  style?: StyleProp<ImageStyle>;
}

const logoSources = {
  dark: require('../../assets/branding/logo-dark.png'),
  light: require('../../assets/branding/logo-light.png'),
  full: require('../../assets/branding/logo-full.png'),
  icon: require('../../assets/branding/logo-icon.png'),
};

export const ELLogo: React.FC<ELLogoProps> = ({
  variant = 'dark',
  size = 40,
  style
}) => {
  const source = logoSources[variant] || logoSources.dark;

  return (
    <Image
      source={source}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  );
};
