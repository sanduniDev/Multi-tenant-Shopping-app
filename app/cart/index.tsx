import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
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
  SemanticColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Backgrounds,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { CartItemCard } from '@/components/ui/cart-item-card';
import { formatPrice } from '@/services/product-service';

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const {
    items,
    loading,
    syncing,
    error,
    subtotal,
    totalQuantity,
    fetchCart,
    updateQuantity,
    removeItem,
    clear,
    validateCart,
  } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();

  const [validating, setValidating] = useState(false);

  // Fetch cart on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchCart(user.id);
      }
    }, [user?.id, fetchCart])
  );

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    await updateQuantity(cartItemId, quantity);
  };

  const handleRemoveItem = (cartItemId: string, productTitle: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${productTitle}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(cartItemId),
        },
      ]
    );
  };

  const handleSaveForLater = async (cartItemId: string, productId: string) => {
    if (!user?.id) return;

    // Add to wishlist first
    const success = await addToWishlist(user.id, productId);
    if (success) {
      // Then remove from cart
      await removeItem(cartItemId);
    }
  };

  const handleClearCart = () => {
    if (!user?.id) return;

    // For web, use window.confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Remove all items from your cart?');
      if (confirmed) {
        clear(user.id).then((success) => {
          if (!success) {
            window.alert('Failed to clear cart');
          }
        });
      }
    } else {
      Alert.alert(
        'Clear Cart',
        'Remove all items from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              const success = await clear(user.id);
              if (!success) {
                Alert.alert('Error', 'Failed to clear cart');
              }
            },
          },
        ]
      );
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const handleCheckout = async () => {
    if (!user?.id) return;

    setValidating(true);
    const { valid, unavailableItems } = await validateCart(user.id);
    setValidating(false);

    if (!valid) {
      const itemNames = unavailableItems
        .map((item) => `• ${item.productTitle}`)
        .join('\n');
      Alert.alert(
        'Some items are unavailable',
        `The following items are out of stock or have insufficient quantity:\n\n${itemNames}\n\nPlease remove or update these items.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to checkout - select address first
    router.push('/checkout/select-address');
  };

  const handleContinueShopping = () => {
    router.push('/(tabs)/explore');
  };

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  // Empty cart state
  if (!loading && items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Cart</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: PrimaryColors.blue50 }]}>
            <Ionicons name="cart-outline" size={64} color={PrimaryColors.blue} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Looks like you haven't added anything to your cart yet
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: PrimaryColors.blue }]}
            onPress={handleContinueShopping}
          >
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
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
          My Cart ({totalQuantity})
        </Text>
        {items.length > 0 && (
          <Pressable onPress={handleClearCart} style={styles.clearButton}>
            <Text style={{ color: SemanticColors.error }}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: SemanticColors.errorBg }]}>
          <Ionicons name="warning" size={20} color={SemanticColors.error} />
          <Text style={[styles.errorText, { color: SemanticColors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => user?.id && fetchCart(user.id)}
            tintColor={PrimaryColors.blue}
          />
        }
        renderItem={({ item }) => (
          <CartItemCard
            item={item}
            onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
            onRemove={() => handleRemoveItem(item.id, item.product.title)}
            onSaveForLater={() => handleSaveForLater(item.id, item.product_id)}
            onPress={() => handleProductPress(item.product_id)}
            disabled={syncing}
          />
        )}
        ListFooterComponent={<View style={{ height: 200 }} />}
      />

      {/* Bottom Summary */}
      <View
        style={[
          styles.summaryContainer,
          {
            backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
            borderTopColor: theme.border,
          },
          Shadows.lg,
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Subtotal ({totalQuantity} items)
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {formatPrice(subtotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Shipping
          </Text>
          <Text style={[styles.summaryValue, { color: SemanticColors.success }]}>
            Calculated at checkout
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: PrimaryColors.blue }]}>
            {formatPrice(subtotal)}
          </Text>
        </View>

        <Pressable
          style={[
            styles.checkoutButton,
            { backgroundColor: PrimaryColors.blue },
            (syncing || validating) && { opacity: 0.7 },
          ]}
          onPress={handleCheckout}
          disabled={syncing || validating || items.length === 0}
        >
          {validating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </Pressable>

        <Pressable style={styles.continueButton} onPress={handleContinueShopping}>
          <Text style={[styles.continueButtonText, { color: PrimaryColors.blue }]}>
            Continue Shopping
          </Text>
        </Pressable>
      </View>
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
  clearButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  checkoutButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  continueButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  continueButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});
