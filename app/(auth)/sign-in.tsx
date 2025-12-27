import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryColors, Typography, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IllustrationPlaceholder } from '@/components/ui/illustration-placeholder';

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, loading } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    const { error } = await signIn(email.trim(), password);

    if (error) {
      showToast({
        message: error.message || 'Sign in failed. Please try again.',
        type: 'error',
        duration: 5000,
      });
    } else {
      showToast({
        message: 'Welcome back!',
        type: 'success',
        duration: 2000,
      });

      // Check if user has selected a role and completed profile
      const { userRoles, profile } = useAuthStore.getState();

      if (!userRoles || userRoles.length === 0) {
        // New user - needs to select a role
        router.replace('/(auth)/role-selection');
      } else if (!profile?.full_name || profile.full_name.trim() === '') {
        // User has role but hasn't completed profile
        router.replace('/(auth)/profile-setup');
      } else {
        // Existing user with role and profile - go to main app
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          testID="sign-in-scroll-view"
        >
          {/* Illustration Area */}
          <IllustrationPlaceholder type="sign-in" heightPercentage={35} />

          {/* Content Area */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                Welcome Back!
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Sign in to continue shopping
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon="mail-outline"
                error={errors.email}
                testID="email-input"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                leftIcon="lock-closed-outline"
                error={errors.password}
                testID="password-input"
              />

              {/* Forgot Password Link */}
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable style={styles.forgotPasswordContainer} testID="forgot-password-link">
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </Link>

              {/* Sign In Button */}
              <Button
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                size="large"
                testID="sign-in-button"
              >
                Sign In
              </Button>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: theme.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  forgotPasswordText: {
    color: PrimaryColors.blue,
    fontSize: 14,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    color: PrimaryColors.blue,
    fontSize: 14,
    fontWeight: '600',
  },
});
