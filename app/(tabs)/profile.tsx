import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/context/theme-context';
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
import { updateProfile, updateAvatar, addUserRole, hasRole } from '@/services/profile-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MenuItemIcon = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  icon: MenuItemIcon;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();
  const { themeMode, setThemeMode } = useTheme();

  const { user, profile, activeRole, userRoles, signOut, fetchProfile, setActiveRole, setUserRoles } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast({
          message: 'Camera roll permission is required',
          type: 'warning',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user) {
        setUploadingAvatar(true);
        const { url, error } = await updateAvatar(user.id, result.assets[0].uri);

        if (error) {
          showToast({ message: 'Failed to update avatar', type: 'error' });
        } else {
          await fetchProfile();
          showToast({ message: 'Avatar updated!', type: 'success' });
        }
        setUploadingAvatar(false);
      }
    } catch (error) {
      setUploadingAvatar(false);
      showToast({ message: 'Failed to pick image', type: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
    });

    if (error) {
      showToast({ message: 'Failed to update profile', type: 'error' });
    } else {
      await fetchProfile();
      setIsEditing(false);
      showToast({ message: 'Profile updated!', type: 'success' });
    }
    setSaving(false);
  };

  const handleSwitchRole = async () => {
    if (!user) return;

    const newRole = activeRole === 'buyer' ? 'seller' : 'buyer';
    const hasNewRole = await hasRole(user.id, newRole);

    if (!hasNewRole) {
      // Add new role to user
      const { error } = await addUserRole(user.id, newRole);
      if (error) {
        showToast({ message: 'Failed to switch role', type: 'error' });
        return;
      }
      // Refresh roles
      const { data: roles } = await import('@/services/profile-service').then(m => m.getUserRoles(user.id));
      if (roles) {
        setUserRoles(roles);
      }
    }

    setActiveRole(newRole);
    showToast({
      message: `Switched to ${newRole === 'buyer' ? 'Buyer' : 'Seller'} mode`,
      type: 'success'
    });
  };

  const handleThemeChange = () => {
    if (Platform.OS === 'web') {
      const choice = window.prompt(
        'Choose your preferred theme:\n1 - Light\n2 - Dark\n3 - System (Auto)',
        '1'
      );
      if (choice === '1') setThemeMode('light');
      else if (choice === '2') setThemeMode('dark');
      else if (choice === '3') setThemeMode('system');
    } else {
      Alert.alert(
        'Appearance',
        'Choose your preferred theme',
        [
          {
            text: 'Light',
            onPress: () => setThemeMode('light'),
          },
          {
            text: 'Dark',
            onPress: () => setThemeMode('dark'),
          },
          {
            text: 'System',
            onPress: () => setThemeMode('system'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSignOut = async () => {
    try {
      if (Platform.OS === 'web') {
        const confirm = window.confirm('Are you sure you want to sign out?');
        if (!confirm) return;
        await signOut();
        router.replace('/(auth)/sign-in');
        return;
      }

      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/(auth)/sign-in');
            },
          },
        ]
      );
    } catch (error) {
      showToast({ message: 'Failed to sign out. Please try again.', type: 'error' });
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'swap-horizontal-outline',
      label: `Switch to ${activeRole === 'buyer' ? 'Seller' : 'Buyer'} Mode`,
      onPress: handleSwitchRole,
      showChevron: true,
    },
    {
      icon: 'receipt-outline',
      label: 'My Orders',
      onPress: () => router.push('/orders'),
      showChevron: true,
    },
    {
      icon: 'moon-outline',
      label: `Appearance: ${getThemeLabel()}`,
      onPress: handleThemeChange,
      showChevron: true,
    },
    {
      icon: 'location-outline',
      label: 'Saved Addresses',
      onPress: () => router.push('/addresses'),
      showChevron: true,
    },
    {
      icon: 'card-outline',
      label: 'Payment Methods',
      onPress: () => showToast({ message: 'Coming soon', type: 'info' }),
      showChevron: true,
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => showToast({ message: 'Coming soon', type: 'info' }),
      showChevron: true,
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => showToast({ message: 'Coming soon', type: 'info' }),
      showChevron: true,
    },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      onPress: handleSignOut,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <Pressable onPress={() => setIsEditing(!isEditing)}>
            <Ionicons
              name={isEditing ? 'close' : 'create-outline'}
              size={24}
              color={PrimaryColors.blue}
            />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
            Shadows.sm,
          ]}
        >
          {/* Avatar */}
          <Pressable style={styles.avatarContainer} onPress={pickImage}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: PrimaryColors.blue50 }]}>
                <Ionicons name="person" size={40} color={PrimaryColors.blue} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </Pressable>

          {/* User Info */}
          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                leftIcon="person-outline"
              />
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />
              <Button onPress={handleSaveProfile} loading={saving} size="medium">
                Save Changes
              </Button>
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {profile?.full_name || 'Set your name'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                {user?.email}
              </Text>
              {profile?.phone && (
                <Text style={[styles.userPhone, { color: theme.textSecondary }]}>
                  {profile.phone}
                </Text>
              )}
            </View>
          )}

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: PrimaryColors.blue + '15' },
            ]}
          >
            <Ionicons
              name={activeRole === 'seller' ? 'storefront' : 'cart'}
              size={16}
              color={PrimaryColors.blue}
            />
            <Text style={[styles.roleText, { color: PrimaryColors.blue }]}>
              {activeRole === 'seller' ? 'Seller' : 'Buyer'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View
          style={[
            styles.menuContainer,
            { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
            Shadows.sm,
          ]}
        >
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? GrayColors[700] : GrayColors[100],
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.danger ? '#EF4444' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.menuItemLabel,
                    { color: item.danger ? '#EF4444' : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {item.showChevron && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* App Version */}
        <Text style={[styles.versionText, { color: theme.textSecondary }]}>
          BazaarX v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PrimaryColors.blue,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
  },
  userPhone: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  editForm: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  roleText: {
    ...Typography.labelMedium,
    fontWeight: '600',
  },
  menuContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    ...Typography.body,
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
});
