import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PrimaryColors, GrayColors, Shadows, BorderRadius, AnimationDurations } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: AnimationDurations.micro });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: AnimationDurations.micro });
  };

  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: { paddingVertical: 10, paddingHorizontal: 16 },
      medium: { paddingVertical: 14, paddingHorizontal: 24 },
      large: { paddingVertical: 16, paddingHorizontal: 32 },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: isDisabled ? PrimaryColors.blue400 : PrimaryColors.blue,
        ...Shadows.md,
      },
      secondary: {
        backgroundColor: isDisabled ? GrayColors[200] : GrayColors[100],
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: isDisabled ? PrimaryColors.blue300 : PrimaryColors.blue,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      opacity: isDisabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size text styles
    const sizeTextStyles: Record<ButtonSize, TextStyle> = {
      small: { fontSize: 14, lineHeight: 20 },
      medium: { fontSize: 16, lineHeight: 24 },
      large: { fontSize: 18, lineHeight: 26 },
    };

    // Variant text styles
    const variantTextStyles: Record<ButtonVariant, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: GrayColors[700] },
      outline: { color: PrimaryColors.blue },
      ghost: { color: PrimaryColors.blue },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  const getLoaderColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return GrayColors[700];
      case 'outline':
      case 'ghost':
        return PrimaryColors.blue;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[getButtonStyle(), animatedStyle, style]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      )}
    </AnimatedPressable>
  );
}

export default Button;
