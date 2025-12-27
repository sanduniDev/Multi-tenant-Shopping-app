import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/services/product-service';
import {
  generateOrderNumber,
  getEstimatedDeliveryDate,
  formatDeliveryDate,
} from '@/utils/order-calculations';
import { PaymentMethod } from '@/services/payment-service';

export default function OrderConfirmationScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const params = useLocalSearchParams<{
    orderId?: string;
    paymentMethod?: PaymentMethod;
  }>();

  const {
    selectedAddress,
    cartItems,
    orderSummary,
    reset: resetCheckout,
  } = useCheckoutStore();

  const [orderNumber] = useState(generateOrderNumber());
  const [estimatedDelivery] = useState(getEstimatedDeliveryDate(5));

  // Animation values
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const cardBackground = isDark ? theme.cardBackground : '#FFFFFF';

  // Run animations on mount
  useEffect(() => {
    runSuccessAnimation();
  }, []);

  const runSuccessAnimation = () => {
    // Animate checkmark
    Animated.sequence([
      Animated.parallel([
        Animated.timing(checkScale, {
          toValue: 1.2,
          duration: 400,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(checkScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Show confetti
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(confettiOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in content
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinueShopping = () => {
    resetCheckout();
    router.replace('/(tabs)/explore');
  };

  const handleViewOrders = () => {
    resetCheckout();
    if (params.orderId) {
      router.replace(`/orders/${params.orderId}`);
    } else {
      router.replace('/orders');
    }
  };

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case 'card':
        return 'Credit/Debit Card';
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      default:
        return 'Paid';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <View style={styles.successContainer}>
          {/* Confetti background */}
          <Animated.View style={[styles.confettiContainer, { opacity: confettiOpacity }]}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.confetti,
                  {
                    backgroundColor: [
                      PrimaryColors.blue,
                      SemanticColors.success,
                      SemanticColors.warning,
                      '#F472B6',
                      '#A78BFA',
                    ][i % 5],
                    left: `${10 + i * 7}%`,
                    top: `${10 + ((i * 13) % 40)}%`,
                    transform: [{ rotate: `${i * 30}deg` }],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Checkmark circle */}
          <Animated.View
            style={[
              styles.checkCircle,
              { backgroundColor: SemanticColors.success },
              {
                transform: [{ scale: checkScale }],
                opacity: checkOpacity,
              },
            ]}
          >
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={[styles.successTitle, { color: theme.text }]}>
              Order Placed Successfully!
            </Text>
            <Text style={[styles.successText, { color: theme.textSecondary }]}>
              Thank you for your order. We've sent a confirmation to your email.
            </Text>
          </Animated.View>
        </View>

        {/* Order Info Card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: cardBackground, opacity: contentOpacity },
            Shadows.sm,
          ]}
        >
          <View style={styles.orderInfoRow}>
            <View style={styles.orderInfoItem}>
              <Text style={[styles.orderInfoLabel, { color: theme.textSecondary }]}>
                Order Number
              </Text>
              <Text style={[styles.orderInfoValue, { color: theme.text }]}>{orderNumber}</Text>
            </View>
            <View style={styles.orderInfoDivider} />
            <View style={styles.orderInfoItem}>
              <Text style={[styles.orderInfoLabel, { color: theme.textSecondary }]}>
                Estimated Delivery
              </Text>
              <Text style={[styles.orderInfoValue, { color: theme.text }]}>
                {formatDeliveryDate(estimatedDelivery)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Payment Method Card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: cardBackground, opacity: contentOpacity },
            Shadows.sm,
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color={PrimaryColors.blue} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Method</Text>
          </View>
          <View style={styles.paymentMethodContent}>
            <View style={styles.paymentMethodRow}>
              <Ionicons
                name={params.paymentMethod === 'cash_on_delivery' ? 'cash' : 'card'}
                size={24}
                color={theme.textSecondary}
              />
              <Text style={[styles.paymentMethodText, { color: theme.text }]}>
                {getPaymentMethodLabel(params.paymentMethod)}
              </Text>
            </View>
            {params.paymentMethod === 'cash_on_delivery' && (
              <View style={[styles.codBadge, { backgroundColor: SemanticColors.warningBg }]}>
                <Ionicons name="information-circle" size={16} color={SemanticColors.warning} />
                <Text style={[styles.codBadgeText, { color: SemanticColors.warning }]}>
                  Please keep {formatPrice(orderSummary.total)} ready for delivery
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Order Summary Card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: cardBackground, opacity: contentOpacity },
            Shadows.sm,
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Order Summary</Text>
          </View>

          {/* Items preview */}
          <View style={styles.itemsPreview}>
            {cartItems.slice(0, 3).map((item) => (
              <Image
                key={item.id}
                source={{
                  uri: item.product?.images?.[0] || 'https://via.placeholder.com/60',
                }}
                style={styles.itemPreviewImage}
              />
            ))}
            {cartItems.length > 3 && (
              <View style={[styles.moreItems, { backgroundColor: GrayColors[100] }]}>
                <Text style={[styles.moreItemsText, { color: GrayColors[600] }]}>
                  +{cartItems.length - 3}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Items ({orderSummary.itemCount})
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {formatPrice(orderSummary.subtotal)}
            </Text>
          </View>

          {orderSummary.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: SemanticColors.success }]}>
                Discount
              </Text>
              <Text style={[styles.summaryValue, { color: SemanticColors.success }]}>
                -{formatPrice(orderSummary.discount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: SemanticColors.success }]}>Free</Text>
          </View>

          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>
              {params.paymentMethod === 'cash_on_delivery' ? 'Total to Pay' : 'Total Paid'}
            </Text>
            <Text style={[styles.totalValue, { color: PrimaryColors.blue }]}>
              {formatPrice(orderSummary.total)}
            </Text>
          </View>
        </Animated.View>

        {/* Delivery Address Card */}
        {selectedAddress && (
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: cardBackground, opacity: contentOpacity },
              Shadows.sm,
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={20} color={PrimaryColors.blue} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Delivery Address</Text>
            </View>
            <View style={styles.addressContent}>
              <Text style={[styles.addressName, { color: theme.text }]}>
                {selectedAddress.full_name}
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
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {selectedAddress.phone}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View style={[styles.actionsContainer, { opacity: contentOpacity }]}>
          <Button onPress={handleViewOrders} variant="outline">
            View My Orders
          </Button>
          <Button onPress={handleContinueShopping}>Continue Shopping</Button>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  orderInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: GrayColors[200],
  },
  orderInfoLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  orderInfoValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h4,
  },
  paymentMethodContent: {
    paddingLeft: Spacing['2xl'],
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  paymentMethodText: {
    ...Typography.body,
    fontWeight: '500',
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  codBadgeText: {
    ...Typography.caption,
    flex: 1,
  },
  itemsPreview: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  itemPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: GrayColors[100],
  },
  moreItems: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    ...Typography.body,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    marginVertical: Spacing.md,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalValue: {
    ...Typography.h3,
    fontWeight: '700',
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
  actionsContainer: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
