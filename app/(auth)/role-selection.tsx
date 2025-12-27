import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/context/toast-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RoleCardProps {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  isDark: boolean;
}

function RoleCard({
  role,
  icon,
  title,
  description,
  isSelected,
  onPress,
  isDark,
}: RoleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.roleCard,
        animatedStyle,
        {
          backgroundColor: isDark
            ? isSelected
              ? PrimaryColors.blue900
              : Colors.dark.surface
            : isSelected
            ? PrimaryColors.blue50
            : '#FFFFFF',
          borderColor: isSelected ? PrimaryColors.blue : GrayColors[200],
          borderWidth: isSelected ? 2 : 1,
        },
        isSelected && Shadows.md,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isSelected
              ? PrimaryColors.blue
              : isDark
              ? GrayColors[700]
              : GrayColors[100],
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={32}
          color={isSelected ? '#FFFFFF' : PrimaryColors.blue}
        />
      </View>

      <View style={styles.roleContent}>
        <Text
          style={[
            styles.roleTitle,
            {
              color: isSelected
                ? PrimaryColors.blue
                : isDark
                ? Colors.dark.text
                : Colors.light.text,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.roleDescription,
            {
              color: isDark ? Colors.dark.textSecondary : GrayColors[500],
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.radioOuter,
          {
            borderColor: isSelected ? PrimaryColors.blue : GrayColors[300],
          },
        ]}
      >
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </AnimatedPressable>
  );
}

export default function RoleSelectionScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const { user, setActiveRole, setUserRoles } = useAuthStore();

  const handleContinue = async () => {
    if (!selectedRole) {
      showToast({
        message: 'Please select how you want to use BazaarX',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!user) {
      showToast({
        message: 'Session expired. Please sign in again.',
        type: 'error',
        duration: 4000,
      });
      router.replace('/(auth)/sign-in');
      return;
    }

    setLoading(true);

    try {
      // Save role to database
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update store with new role
      setActiveRole(selectedRole);
      setUserRoles([data]);

      showToast({
        message: `You're now set up as a ${selectedRole === 'buyer' ? 'Buyer' : 'Seller'}!`,
        type: 'success',
        duration: 2000,
      });

      // Navigate to profile setup
      router.push('/(auth)/profile-setup');
    } catch (error: any) {
      showToast({
        message: error.message || 'Something went wrong. Please try again.',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            How will you use{'\n'}BazaarX?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            You can switch between roles anytime
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          <RoleCard
            role="buyer"
            icon="cart-outline"
            title="I want to Buy"
            description="Browse and shop from sellers, discover products, and make purchases"
            isSelected={selectedRole === 'buyer'}
            onPress={() => setSelectedRole('buyer')}
            isDark={isDark}
          />

          <RoleCard
            role="seller"
            icon="storefront-outline"
            title="I want to Sell"
            description="List products, manage your store, and grow your business"
            isSelected={selectedRole === 'seller'}
            onPress={() => setSelectedRole('seller')}
            isDark={isDark}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            onPress={handleContinue}
            loading={loading}
            disabled={!selectedRole || loading}
            size="large"
          >
            Continue
          </Button>

          <Text style={[styles.footerHint, { color: theme.textSecondary }]}>
            <Ionicons name="swap-horizontal-outline" size={14} color={theme.textSecondary} />
            {'  '}You can switch roles anytime from settings
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['6xl'],
    paddingBottom: Spacing['3xl'],
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  title: {
    ...Typography.displayMedium,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  roleDescription: {
    ...Typography.bodySmall,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PrimaryColors.blue,
  },
  footer: {
    gap: Spacing.lg,
  },
  footerHint: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
