import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
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
  Backgrounds,
  Shadows,
} from '@/constants/theme';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/services/product-service';
import { formatCouponDiscount } from '@/services/coupon-service';

export default function OrderSummaryScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const isFocused = useIsFocused();

  const {
    selectedAddress,
    appliedCoupon,
    cartItems,
    orderSummary,
    couponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
    calculateOrderSummary,
    setCartItems,
  } = useCheckoutStore();

  const { items: storeCartItems } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Sync cart items and recalculate on mount
  useEffect(() => {
    setCartItems(storeCartItems);
    calculateOrderSummary();
  }, [storeCartItems, setCartItems, calculateOrderSummary]);

  // Redirect if no address selected
  useEffect(() => {
    if (isFocused && !selectedAddress) {
      router.replace('/checkout/select-address');
    }
  }, [isFocused, selectedAddress]);

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const cardBackground = isDark ? theme.cardBackground : '#FFFFFF';

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const success = await applyCoupon(couponCode.trim());
    if (success) {
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  const handleChangeAddress = () => {
    router.push('/checkout/select-address');
  };

  const handleProceedToPayment = () => {
    router.push('/checkout/payment');
  };

  if (!selectedAddress) {
    return null; // Will redirect
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
          Order Summary
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <Text style={[styles.progressText, { color: SemanticColors.success }]}>Address</Text>
        </View>
        <View style={[styles.progressLine, { backgroundColor: PrimaryColors.blue }]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <Text style={[styles.progressText, styles.progressTextActive]}>Summary</Text>
        </View>
        <View style={[styles.progressLine, { backgroundColor: GrayColors[300] }]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, { backgroundColor: GrayColors[300] }]} />
          <Text style={[styles.progressText, { color: GrayColors[400] }]}>Payment</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shipping Address Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="location-outline" size={20} color={PrimaryColors.blue} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Shipping Address
              </Text>
            </View>
            <Pressable onPress={handleChangeAddress}>
              <Text style={[styles.changeButton, { color: PrimaryColors.blue }]}>
                Change
              </Text>
            </Pressable>
          </View>
          <View style={styles.addressContent}>
            <Text style={[styles.addressName, { color: theme.text }]}>
              {selectedAddress.full_name}
            </Text>
            <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
              {selectedAddress.phone}
            </Text>
            <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
              {selectedAddress.address_line1}
            </Text>
            {selectedAddress.address_line2 && (
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {selectedAddress.address_line2}
              </Text>
            )}
            <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
              {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
            </Text>
          </View>
        </View>

        {/* Order Items Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="bag-outline" size={20} color={PrimaryColors.blue} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Order Items ({orderSummary.itemCount})
              </Text>
            </View>
          </View>
          <View style={styles.itemsList}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Image
                  source={{
                    uri: item.product?.images?.[0] || 'https://via.placeholder.com/80',
                  }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text
                    style={[styles.itemTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.product?.title}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: theme.text }]}>
                  {formatPrice((item.product?.price || 0) * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Coupon Section Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="pricetag-outline" size={20} color={PrimaryColors.blue} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Coupon Code
              </Text>
            </View>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedCoupon}>
              <View style={[styles.couponBadge, { backgroundColor: SemanticColors.successBg }]}>
                <Ionicons name="checkmark-circle" size={20} color={SemanticColors.success} />
                <View style={styles.couponInfo}>
                  <Text style={[styles.couponCode, { color: SemanticColors.success }]}>
                    {appliedCoupon.code}
                  </Text>
                  <Text style={[styles.couponDiscount, { color: theme.textSecondary }]}>
                    {formatCouponDiscount(appliedCoupon)} applied
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleRemoveCoupon} style={styles.removeButton}>
                <Ionicons name="close-circle" size={24} color={SemanticColors.error} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.couponInput}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? theme.inputBackground : GrayColors[50],
                    borderColor: couponError ? SemanticColors.error : theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                placeholderTextColor={theme.placeholder}
                autoCapitalize="characters"
              />
              <Pressable
                style={[
                  styles.applyButton,
                  { backgroundColor: PrimaryColors.blue },
                  (!couponCode.trim() || couponLoading) && { opacity: 0.6 },
                ]}
                onPress={handleApplyCoupon}
                disabled={!couponCode.trim() || couponLoading}
              >
                {couponLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply</Text>
                )}
              </Pressable>
            </View>
          )}

          {couponError && (
            <View style={styles.couponErrorContainer}>
              <Ionicons name="alert-circle" size={16} color={SemanticColors.error} />
              <Text style={styles.couponErrorText}>{couponError}</Text>
            </View>
          )}

          {/* Sample codes hint */}
          <View style={styles.couponHint}>
            <Text style={[styles.couponHintText, { color: theme.textSecondary }]}>
              Try: SAVE10, FLAT5, or WELCOME20
            </Text>
          </View>
        </View>

        {/* Price Summary Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="receipt-outline" size={20} color={PrimaryColors.blue} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Price Details
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Subtotal ({orderSummary.itemCount} items)
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {formatPrice(orderSummary.subtotal)}
            </Text>
          </View>

          {orderSummary.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: SemanticColors.success }]}>
                Discount
              </Text>
              <Text style={[styles.priceValue, { color: SemanticColors.success }]}>
                -{formatPrice(orderSummary.discount)}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Shipping
            </Text>
            <Text style={[styles.priceValue, { color: SemanticColors.success }]}>
              Free
            </Text>
          </View>

          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: PrimaryColors.blue }]}>
              {formatPrice(orderSummary.total)}
            </Text>
          </View>

          {orderSummary.discount > 0 && (
            <View style={[styles.savingsBadge, { backgroundColor: SemanticColors.successBg }]}>
              <Ionicons name="sparkles" size={16} color={SemanticColors.success} />
              <Text style={[styles.savingsText, { color: SemanticColors.success }]}>
                You're saving {formatPrice(orderSummary.discount)} on this order!
              </Text>
            </View>
          )}
        </View>

        {/* Terms Checkbox */}
        <Pressable
          style={styles.termsContainer}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: termsAccepted ? PrimaryColors.blue : GrayColors[400],
                backgroundColor: termsAccepted ? PrimaryColors.blue : 'transparent',
              },
            ]}
          >
            {termsAccepted && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            I agree to the{' '}
            <Text style={{ color: PrimaryColors.blue }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: PrimaryColors.blue }}>Privacy Policy</Text>
          </Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

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
        <View style={styles.bottomTotal}>
          <Text style={[styles.bottomTotalLabel, { color: theme.textSecondary }]}>
            Total
          </Text>
          <Text style={[styles.bottomTotalValue, { color: theme.text }]}>
            {formatPrice(orderSummary.total)}
          </Text>
        </View>
        <Button
          onPress={handleProceedToPayment}
          disabled={!termsAccepted || cartItems.length === 0}
          style={{ flex: 1 }}
        >
          Proceed to Payment
        </Button>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
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
  progressDotComplete: {
    backgroundColor: SemanticColors.success,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h4,
  },
  changeButton: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  addressContent: {
    paddingLeft: Spacing['2xl'],
  },
  addressName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  addressLine: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  itemsList: {
    gap: Spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: GrayColors[100],
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  itemQuantity: {
    ...Typography.caption,
  },
  itemPrice: {
    ...Typography.body,
    fontWeight: '600',
  },
  couponInput: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  applyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    ...Typography.body,
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    ...Typography.body,
    fontWeight: '700',
  },
  couponDiscount: {
    ...Typography.caption,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  couponErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  couponErrorText: {
    ...Typography.caption,
    color: SemanticColors.error,
  },
  couponHint: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GrayColors[200],
  },
  couponHintText: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    ...Typography.body,
  },
  priceValue: {
    ...Typography.body,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  savingsText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    ...Typography.bodySmall,
    flex: 1,
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  bottomTotal: {
    alignItems: 'flex-start',
  },
  bottomTotalLabel: {
    ...Typography.caption,
  },
  bottomTotalValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
});
