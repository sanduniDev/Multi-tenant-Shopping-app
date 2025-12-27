import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PrimaryColors,
  GrayColors,
  SemanticColors,
  BorderRadius,
  Colors,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  testID?: string;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  testID,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  const getBorderColor = () => {
    if (error) return SemanticColors.error;
    if (isFocused) return PrimaryColors.blue;
    return theme.inputBorder;
  };

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBackground,
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 2 : 1,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? PrimaryColors.blue : GrayColors[400]}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              paddingLeft: leftIcon ? 0 : 16,
              paddingRight: isPassword || rightIcon ? 0 : 16,
            },
          ]}
          placeholderTextColor={theme.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          testID={testID}
          accessibilityLabel={label}
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={handlePasswordToggle}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={GrayColors[400]}
            />
          </Pressable>
        )}

        {rightIcon && !isPassword && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon} size={20} color={GrayColors[400]} />
          </Pressable>
        )}
      </View>

      {error && (
        <Text
          style={styles.error}
          testID={testID ? `${testID}-error` : undefined}
          accessibilityLabel={error}
        >
          {error}
        </Text>
      )}

      {hint && !error && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    minHeight: 52,
  },
  leftIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  rightIconContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: SemanticColors.error,
    fontSize: 12,
    marginTop: 6,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default Input;
