import { GrayColors, PrimaryColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { height } = Dimensions.get('window');

type IllustrationType = 'sign-in' | 'sign-up' | 'forgot-password' | 'role-selection' | 'profile-setup' | 'reset-password';

interface IllustrationPlaceholderProps {
  type: IllustrationType;
  heightPercentage?: number;
}

const illustrationConfig: Record<IllustrationType, { icon: keyof typeof Ionicons.glyphMap; subtitle: string }> = {
  'sign-in': {
    icon: 'storefront-outline',
    subtitle: 'Welcome to the marketplace',
  },
  'sign-up': {
    icon: 'person-add-outline',
    subtitle: 'Join our community',
  },
  'forgot-password': {
    icon: 'mail-outline',
    subtitle: 'Reset your password',
  },
  'reset-password': {
    icon: 'mail-outline',
    subtitle: 'Reset your password',
  },
  'role-selection': {
    icon: 'people-outline',
    subtitle: 'Choose your role',
  },
  'profile-setup': {
    icon: 'create-outline',
    subtitle: 'Complete your profile',
  },
};

export function IllustrationPlaceholder({
  type,
  heightPercentage = 35,
}: IllustrationPlaceholderProps) {
  const config = illustrationConfig[type];
  const containerHeight = (height * heightPercentage) / 100;

  return (
    <LinearGradient
      colors={[PrimaryColors.blue50, '#FFFFFF']}
      style={[styles.container, { height: containerHeight }]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon}
            size={80}
            color={PrimaryColors.blue}
          />
        </View>
        <Text style={styles.brandName}>BazaarX</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: PrimaryColors.blue,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GrayColors[500],
  },
});

export default IllustrationPlaceholder;
