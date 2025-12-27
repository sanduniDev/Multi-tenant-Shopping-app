import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  Typography,
  Spacing,
  BorderRadius,
  Backgrounds,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useAddressStore } from '@/store/address-store';
import { AddressCard } from '@/components/ui/address-card';
import { Address } from '@/types/database';

export default function AddressListScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const {
    addresses,
    loading,
    syncing,
    error,
    fetchAddresses,
    removeAddress,
    makeDefault,
  } = useAddressStore();

  // Fetch addresses on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchAddresses(user.id);
      }
    }, [user?.id, fetchAddresses])
  );

  const handleAddAddress = () => {
    router.push('/addresses/add');
  };

  const handleEditAddress = (address: Address) => {
    router.push({
      pathname: '/addresses/edit',
      params: { id: address.id },
    });
  };

  const handleDeleteAddress = (address: Address) => {
    const confirmDelete = () => {
      if (user?.id) {
        removeAddress(address.id, user.id);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Delete this address?\n${address.address_line1}, ${address.city}`
      );
      if (confirmed) confirmDelete();
    } else {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to delete this address?\n\n${address.address_line1}, ${address.city}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  const handleSetDefault = (address: Address) => {
    if (user?.id) {
      makeDefault(address.id, user.id);
    }
  };

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  // Empty state
  if (!loading && addresses.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            My Addresses
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: PrimaryColors.blue50 }]}>
            <Ionicons name="location-outline" size={64} color={PrimaryColors.blue} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No addresses yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Add a shipping address to get started with your orders
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: PrimaryColors.blue }]}
            onPress={handleAddAddress}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Add Address</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          My Addresses
        </Text>
        <Pressable onPress={handleAddAddress} style={styles.addButton}>
          <Ionicons name="add" size={24} color={PrimaryColors.blue} />
        </Pressable>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2' }]}>
          <Ionicons name="warning" size={20} color="#DC2626" />
          <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
        </View>
      )}

      {/* Address List */}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => user?.id && fetchAddresses(user.id)}
            tintColor={PrimaryColors.blue}
          />
        }
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            onEdit={() => handleEditAddress(item)}
            onDelete={() => handleDeleteAddress(item)}
            onSetDefault={() => handleSetDefault(item)}
            showActions
          />
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Floating Add Button */}
      <Pressable
        style={[
          styles.fab,
          { backgroundColor: PrimaryColors.blue },
          syncing && { opacity: 0.7 },
        ]}
        onPress={handleAddAddress}
        disabled={syncing}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerRight: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
