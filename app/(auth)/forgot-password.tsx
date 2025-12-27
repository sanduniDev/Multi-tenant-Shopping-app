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
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, PrimaryColors, GrayColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IllustrationPlaceholder } from '@/components/ui/illustration-placeholder';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword, loading } = useAuthStore();

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    const { error: resetError } = await resetPassword(email.trim());

    if (resetError) {
      showToast({
        message: resetError.message || 'Failed to send reset link. Please try again.',
        type: 'error',
        duration: 5000,
      });
    } else {
      setEmailSent(true);
    }
  };

  const handleBackToSignIn = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="mail-outline" size={64} color={PrimaryColors.blue} />
          </View>

          <Text style={[styles.successTitle, { color: theme.text }]}>
            Check Your Email
          </Text>

          <Text style={[styles.successMessage, { color: theme.textSecondary }]}>
            We've sent a password reset link to:
          </Text>

          <Text style={[styles.emailText, { color: theme.text }]}>{email}</Text>

          <Text style={[styles.successHint, { color: theme.textSecondary }]}>
            Click the link in the email to reset your password. If you don't see
            it, check your spam folder.
          </Text>

          <Button
            onPress={handleBackToSignIn}
            variant="primary"
            size="large"
            style={styles.backButton}
          >
            Back to Sign In
          </Button>

          <Pressable
            onPress={() => setEmailSent(false)}
            style={styles.resendContainer}
          >
            <Text style={styles.resendText}>Didn't receive the email? </Text>
            <Text style={styles.resendLink}>Resend</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        >
          {/* Back Button */}
          <Pressable
            onPress={handleBackToSignIn}
            style={styles.backButtonHeader}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </Pressable>

          {/* Illustration Area */}
          <IllustrationPlaceholder type="forgot-password" heightPercentage={32} />

          {/* Content Area */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                Reset Password
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter your email address and we'll send you a link to reset your
                password.
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
                error={error}
              />

              {/* Reset Button */}
              <Button
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                size="large"
                style={styles.resetButton}
              >
                Send Reset Link
              </Button>
            </View>

            {/* Back to Sign In Link */}
            <Pressable
              onPress={handleBackToSignIn}
              style={styles.signInContainer}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={PrimaryColors.blue}
              />
              <Text style={styles.signInLink}> Back to Sign In</Text>
            </Pressable>
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
  backButtonHeader: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  resetButton: {
    marginTop: Spacing.md,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signInLink: {
    color: PrimaryColors.blue,
    fontSize: 14,
    fontWeight: '600',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: PrimaryColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  successTitle: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emailText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  successHint: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  backButton: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    color: GrayColors[500],
    fontSize: 14,
  },
  resendLink: {
    color: PrimaryColors.blue,
    fontSize: 14,
    fontWeight: '600',
  },
});
