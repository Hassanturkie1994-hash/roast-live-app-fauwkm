
import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface RoastLiveLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  opacity?: number;
}

export default function RoastLiveLogo({ size = 'medium', style, opacity = 1 }: RoastLiveLogoProps) {
  const sizeStyles = {
    small: { width: 80, height: 24 },
    medium: { width: 120, height: 36 },
    large: { width: 160, height: 48 },
    xlarge: { width: 240, height: 72 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('@/assets/images/edb5f73e-bafa-40d0-a38f-dd668034d64f.png')}
        style={[
          styles.logo,
          {
            width: currentSize.width,
            height: currentSize.height,
            opacity,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Image styling
  },
});
