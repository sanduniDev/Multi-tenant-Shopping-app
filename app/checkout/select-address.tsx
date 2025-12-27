import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
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
  Shadows,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useAddressStore } from '@/store/address-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';
import { AddressCard } from '@/components/ui/address-card';
import { Button } from '@/components/ui/button';
import { Address } from '@/types/database';

export default function SelectAddressScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const { addresses, defaultAddress, loading, fetchAddresses } = useAddressStore();
  const { selectedAddress, setSelectedAddress, setCartItems } = useCheckoutStore();
  const { items: cartItems } = useCartStore();

  // Fetch addresses and initialize checkout state
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchAddresses(user.id);
      }
    }, [user?.id, fetchAddresses])
  );

  // Set cart items in checkout store
  useEffect(() => {
    setCartItems(cartItems);
  }, [cartItems, setCartItems]);

  // Auto-select default address if none selected
  useEffect(() => {
    if (!selectedAddress && defaultAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [defaultAddress, selectedAddress, setSelectedAddress]);

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleAddAddress = () => {
    router.push('/addresses/add');
  };

  const handleContinue = () => {
    if (selectedAddress) {
      router.push('/checkout/order-summary');
    }
  };

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  // Loading state
  if (loading && addresses.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading addresses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No addresses state
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
            Select Address
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={[styles.progressText, styles.progressTextActive]}>Address</Text>
          </View>
          <View style={[styles.progressLine, { backgroundColor: GrayColors[300] }]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, { backgroundColor: GrayColors[300] }]} />
            <Text style={[styles.progressText, { color: GrayColors[400] }]}>Summary</Text>
          </View>
          <View style={[styles.progressLine, { backgroundColor: GrayColors[300] }]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, { backgroundColor: GrayColors[300] }]} />
            <Text style={[styles.progressText, { color: GrayColors[400] }]}>Payment</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: PrimaryColors.blue50 }]}>
            <Ionicons name="location-outline" size={64} color={PrimaryColors.blue} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No shipping address
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Please add a shipping address to continue with your order
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
          Select Address
        </Text>
        <Pressable onPress={handleAddAddress} style={styles.addButton}>
          <Ionicons name="add" size={24} color={PrimaryColors.blue} />
        </Pressable>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <Text style={[styles.progressText, styles.progressTextActive]}>Address</Text>
        </View>
        <View style={[styles.progressLine, { backgroundColor: GrayColors[300] }]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, { backgroundColor: GrayColors[300] }]} />
          <Text style={[styles.progressText, { color: GrayColors[400] }]}>Summary</Text>
        </View>
        <View style={[styles.progressLine, { backgroundColor: GrayColors[300] }]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, { backgroundColor: GrayColors[300] }]} />
          <Text style={[styles.progressText, { color: GrayColors[400] }]}>Payment</Text>
        </View>
      </View>

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
            selected={selectedAddress?.id === item.id}
            selectable
            onPress={() => handleSelectAddress(item)}
            showActions={false}
          />
        )}
        ListFooterComponent={
          <Pressable
            style={[
              styles.addNewButton,
              {
                borderColor: isDark ? theme.border : GrayColors[300],
              },
            ]}
            onPress={handleAddAddress}
          >
            <Ionicons name="add-circle-outline" size={24} color={PrimaryColors.blue} />
            <Text style={[styles.addNewText, { color: PrimaryColors.blue }]}>
              Add New Address
            </Text>
          </Pressable>
        }
      />

      {/* Bottom Button */}
      <View
        style={[
          styles.bottomContainer,
          {
            backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
            borderTopColor: theme.border,
          },
          Shadows.lg,
        ]}
      >
        <Button
          onPress={handleContinue}
          disabled={!selectedAddress}
        >
          Continue to Order Summary
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  progressDotActive: {
    backgroundColor: PrimaryColors.blue,
  },
  progressText: {
    ...Typography.caption,
  },
  progressTextActive: {
    color: PrimaryColors.blue,
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  addNewText: {
    ...Typography.body,
    fontWeight: '600',
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
