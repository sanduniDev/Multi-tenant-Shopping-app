import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/context/toast-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IllustrationPlaceholder } from '@/components/ui/illustration-placeholder';

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export default function ProfileSetupScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { user, activeRole, fetchProfile } = useAuthStore();

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showToast({
          message: 'Sorry, we need camera roll permissions to upload an avatar.',
          type: 'warning',
          duration: 4000,
        });
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to pick image',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    // Phone is optional but validate if provided
    if (phone && !/^\+?[\d\s-]{10,}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarUri || !user) return null;

    try {
      setUploadingAvatar(true);

      // Convert image URI to blob for upload
      const response = await fetch(avatarUri);
      const blob = await response.blob();
      const fileExt = avatarUri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      showToast({
        message: 'Failed to upload avatar. Continuing without it.',
        type: 'warning',
        duration: 3000,
      });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleComplete = async () => {
    if (!validateForm()) return;

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
      // Upload avatar if selected
      let avatarUrl: string | null = null;
      if (avatarUri) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Refresh profile in store
      await fetchProfile();

      showToast({
        message: 'Profile setup complete! Welcome to BazaarX!',
        type: 'success',
        duration: 3000,
      });

      router.replace('/(tabs)');
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

  const handleSkip = () => {
    showToast({
      message: 'You can complete your profile later in Settings',
      type: 'info',
      duration: 3000,
    });
    router.replace('/(tabs)');
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
        >
          {/* Skip Button */}
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>

          {/* Illustration Area */}
          <IllustrationPlaceholder type="profile-setup" heightPercentage={28} />

          {/* Content Area */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                Complete Your Profile
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {activeRole === 'seller'
                  ? 'Help buyers know who they\'re purchasing from'
                  : 'Help sellers know who they\'re selling to'}
              </Text>
            </View>

            {/* Avatar Placeholder */}
            <Pressable style={styles.avatarContainer} onPress={pickImage}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: PrimaryColors.blue50 },
                ]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={PrimaryColors.blue}
                  />
                )}
              </View>
              <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
                {avatarUri ? 'Tap to change photo' : 'Tap to add photo'}
              </Text>
              {uploadingAvatar && (
                <Text style={[styles.uploadingText, { color: PrimaryColors.blue }]}>
                  Uploading...
                </Text>
              )}
            </Pressable>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                leftIcon="person-outline"
                error={errors.fullName}
              />

              <Input
                label="Phone Number (Optional)"
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                leftIcon="call-outline"
                error={errors.phone}
                hint="This helps with order updates and delivery"
              />

              {/* Role Badge */}
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      colorScheme === 'dark'
                        ? Colors.dark.surface
                        : GrayColors[50],
                  },
                ]}
              >
                <Ionicons
                  name={activeRole === 'seller' ? 'storefront-outline' : 'cart-outline'}
                  size={20}
                  color={PrimaryColors.blue}
                />
                <Text style={[styles.roleBadgeText, { color: theme.text }]}>
                  Starting as {activeRole === 'seller' ? 'Seller' : 'Buyer'}
                </Text>
              </View>
            </View>

            {/* Complete Button */}
            <Button
              onPress={handleComplete}
              loading={loading}
              disabled={loading}
              size="large"
            >
              Complete Setup
            </Button>

            <Text style={[styles.footerHint, { color: theme.textSecondary }]}>
              You can always update your profile later in settings
            </Text>
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
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: PrimaryColors.blue,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: PrimaryColors.blue,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarHint: {
    ...Typography.caption,
  },
  uploadingText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  roleBadgeText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  footerHint: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
