import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
import { useAuthStore } from '@/store/auth-store';
import { useOrderStore } from '@/store/order-store';
import { useCartStore } from '@/store/cart-store';
import { useToast } from '@/context/toast-context';
import {
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderStatusBgColor,
  formatOrderDate,
  formatOrderTime,
  canCancelOrder,
  ShippingAddress,
} from '@/services/order-service';
import { formatPrice } from '@/services/product-service';
import { OrderStatusTimeline } from '@/components/ui/order-status-timeline';
import { Button } from '@/components/ui/button';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const { selectedOrder, buyerLoading, fetchOrderDetails, cancelOrder, reorder, clearSelectedOrder } =
    useOrderStore();
  const { fetchCart } = useCartStore();
  const { showToast } = useToast();

  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<{
    name: string;
    phone?: string;
    email?: string;
  } | null>(null);

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const cardBackground = isDark ? theme.cardBackground : '#FFFFFF';

  useEffect(() => {
    return () => {
      clearSelectedOrder();
    };
  }, []);

  // Always refresh order details when screen is focused to reflect latest seller updates
  useFocusEffect(
    useCallback(() => {
      if (id && user?.id) {
        fetchOrderDetails(id, user.id);
      }
    }, [id, user?.id, fetchOrderDetails])
  );

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(`${title}: ${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleCancelOrder = () => {
    if (!selectedOrder || !user?.id) return;

    showAlert('Cancel Order', 'Are you sure you want to cancel this order? This action cannot be undone.', [
      { text: 'No, Keep Order', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          const success = await cancelOrder(selectedOrder.id, user.id);
          setCancelling(false);

          if (success) {
            showToast({ message: 'Order cancelled', type: 'success' });
          } else {
            showToast({ message: 'Failed to cancel order. Please try again.', type: 'error' });
          }
        },
      },
    ]);
  };

  const handleReorder = async () => {
    if (!selectedOrder || !user?.id) return;

    setReordering(true);
    const result = await reorder(selectedOrder.id, user.id);
    setReordering(false);

    if (result.success) {
      await fetchCart(user.id);

      let message = `${result.itemsAdded} item(s) added to your cart.`;
      if (result.unavailable.length > 0) {
        message += `\n\nUnavailable items:\n${result.unavailable.join('\n')}`;
      }

      showAlert('Items Added to Cart', message, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => router.push('/cart') },
      ]);
    } else {
      showAlert('Error', 'Failed to add items to cart. Please try again.');
    }
  };

  const handleContactSeller = (seller: { full_name?: string | null; phone?: string; email?: string }) => {
    setSelectedSeller({
      name: seller.full_name || 'Seller',
      phone: seller.phone,
      email: seller.email,
    });
    setShowContactModal(true);
  };

  if (buyerLoading || !selectedOrder) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const order = selectedOrder;
  const shippingAddress = order.shipping_address as ShippingAddress | undefined;
  const deriveOrderStatus = (): OrderStatus => {
    const statuses = order.items.map((item) => item.status as OrderStatus);
    const allCancelled = statuses.length > 0 && statuses.every((s) => s === 'cancelled');
    if (allCancelled) return 'cancelled';
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('shipped')) return 'shipped';
    if (statuses.includes('delivered')) return 'delivered';
    return order.status as OrderStatus;
  };
  const orderStatus = deriveOrderStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/orders')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order ID and Status */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderLabel, { color: theme.textSecondary }]}>Order Number</Text>
              <Text style={[styles.orderId, { color: theme.text }]}>
                #{order.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: getOrderStatusBgColor(orderStatus) }]}
            >
              <Text style={[styles.statusText, { color: getOrderStatusColor(orderStatus) }]}>
                {getOrderStatusLabel(orderStatus)}
              </Text>
            </View>
          </View>
          <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
            Placed on {formatOrderDate(order.created_at)} at {formatOrderTime(order.created_at)}
          </Text>
        </View>

        {/* Order Timeline */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Status</Text>
          <OrderStatusTimeline
            currentStatus={orderStatus}
            createdAt={order.created_at}
            updatedAt={order.updated_at}
          />
        </View>

        {/* Shipping Address */}
        {shippingAddress && (
          <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={PrimaryColors.blue} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Shipping Address</Text>
            </View>
            <View style={styles.addressContent}>
              <Text style={[styles.addressName, { color: theme.text }]}>
                {shippingAddress.full_name}
              </Text>
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {shippingAddress.phone}
              </Text>
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {shippingAddress.address_line1}
              </Text>
              {shippingAddress.address_line2 && (
                <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                  {shippingAddress.address_line2}
                </Text>
              )}
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
              </Text>
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {shippingAddress.country}
              </Text>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={20} color={PrimaryColors.blue} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Order Items ({order.items.length})
            </Text>
          </View>
          {order.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.orderItem,
                index < order.items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <Image
                source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/80' }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.product?.title}
                </Text>
                <Text style={[styles.itemSeller, { color: theme.textSecondary }]}>
                  Sold by: {item.product?.seller?.full_name || 'Seller'}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>
                    Qty: {item.quantity}
                  </Text>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>
                    {formatPrice(Number(item.price) * item.quantity)}
                  </Text>
                </View>
                {item.tracking_number && (
                  <View style={[styles.trackingBadge, { backgroundColor: SemanticColors.infoBg }]}>
                    <Ionicons name="locate-outline" size={14} color={SemanticColors.info} />
                    <Text style={[styles.trackingText, { color: SemanticColors.info }]}>
                      Tracking: {item.tracking_number}
                    </Text>
                  </View>
                )}
              </View>
              {item.product?.seller && (
                <Pressable
                  style={styles.contactButton}
                  onPress={() => handleContactSeller(item.product.seller!)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={PrimaryColors.blue} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color={PrimaryColors.blue} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Price Details</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Subtotal ({order.items.reduce((sum, i) => sum + i.quantity, 0)} items)
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {formatPrice(order.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0))}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Shipping</Text>
            <Text style={[styles.priceValue, { color: SemanticColors.success }]}>Free</Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: PrimaryColors.blue }]}>
              {formatPrice(order.total_amount)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canCancelOrder(orderStatus) && (
            <Button
              variant="outline"
              onPress={handleCancelOrder}
              loading={cancelling}
              style={styles.cancelButton}
            >
              Cancel Order
            </Button>
          )}
          <Button
            onPress={handleReorder}
            loading={reordering}
            style={styles.reorderButton}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Reorder</Text>
            </View>
          </Button>
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Contact Seller Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowContactModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Contact {selectedSeller?.name}
            </Text>
            {selectedSeller?.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={20} color={PrimaryColors.blue} />
                <Text style={[styles.contactText, { color: theme.text }]}>
                  {selectedSeller.phone}
                </Text>
              </View>
            )}
            {selectedSeller?.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={20} color={PrimaryColors.blue} />
                <Text style={[styles.contactText, { color: theme.text }]}>
                  {selectedSeller.email}
                </Text>
              </View>
            )}
            {!selectedSeller?.phone && !selectedSeller?.email && (
              <Text style={[styles.noContact, { color: theme.textSecondary }]}>
                No contact information available
              </Text>
            )}
            <Pressable
              style={[styles.modalButton, { backgroundColor: PrimaryColors.blue }]}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    gap: Spacing.lg,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  orderId: {
    ...Typography.h4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  orderDate: {
    ...Typography.bodySmall,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
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
  orderItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: GrayColors[100],
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSeller: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    ...Typography.bodySmall,
  },
  itemPrice: {
    ...Typography.body,
    fontWeight: '600',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  trackingText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: PrimaryColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
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
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  reorderButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GrayColors[200],
  },
  contactText: {
    ...Typography.body,
  },
  noContact: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  modalButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
