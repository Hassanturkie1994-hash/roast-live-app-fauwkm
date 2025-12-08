
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, buttonStyles } from '@/styles/commonStyles';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

export default function GradientButton({
  title,
  onPress,
  size = 'medium',
  style,
  disabled = false,
}: GradientButtonProps) {
  const buttonSize = {
    small: { paddingVertical: 8, paddingHorizontal: 20 },
    medium: { paddingVertical: 12, paddingHorizontal: 28 },
    large: { paddingVertical: 16, paddingHorizontal: 36 },
  };

  const textSize = {
    small: 12,
    medium: 14,
    large: 16,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          disabled
            ? ['#666666', '#444444']
            : [colors.gradientStart, colors.gradientEnd]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[buttonStyles.gradientButton, buttonSize[size]]}
      >
        <Text
          style={[
            buttonStyles.gradientButtonText,
            { fontSize: textSize[size] },
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  disabledText: {
    opacity: 0.6,
  },
});
