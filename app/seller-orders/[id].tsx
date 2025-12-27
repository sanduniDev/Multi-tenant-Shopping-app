import React, { useEffect, useState } from 'react';
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
  TextInput,
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
import { useAuthStore } from '@/store/auth-store';
import { useOrderStore } from '@/store/order-store';
import {
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderStatusBgColor,
  formatOrderDate,
  formatOrderTime,
  getNextStatus,
  ShippingAddress,
} from '@/services/order-service';
import { formatPrice } from '@/services/product-service';
import { OrderStatusTimeline } from '@/components/ui/order-status-timeline';
import { Button } from '@/components/ui/button';

export default function SellerOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const {
    selectedSellerOrder,
    sellerLoading,
    fetchSellerOrderDetails,
    updateOrderItemStatus,
    clearSelectedSellerOrder,
  } = useOrderStore();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const cardBackground = isDark ? theme.cardBackground : '#FFFFFF';

  useEffect(() => {
    if (id && user?.id) {
      fetchSellerOrderDetails(id, user.id);
    }

    return () => {
      clearSelectedSellerOrder();
    };
  }, [id, user?.id]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedSellerOrder || !user?.id) return;

    const currentStatus = selectedSellerOrder.status as OrderStatus;
    const nextStatus = getNextStatus(currentStatus);

    if (!nextStatus) {
      showAlert('Cannot Update', 'This order has reached its final status.');
      return;
    }

    // Require tracking number for shipping
    if (nextStatus === 'shipped' && !trackingNumber.trim()) {
      showAlert('Tracking Required', 'Please enter a tracking number before marking as shipped.');
      return;
    }

    setUpdating(true);
    const success = await updateOrderItemStatus(
      selectedSellerOrder.id,
      user.id,
      nextStatus,
      nextStatus === 'shipped' ? trackingNumber.trim() : undefined
    );
    setUpdating(false);
    setShowUpdateModal(false);

    if (success) {
      setTrackingNumber('');
      showAlert('Status Updated', `Order has been marked as ${getOrderStatusLabel(nextStatus)}.`);
    } else {
      showAlert('Error', 'Failed to update order status. Please try again.');
    }
  };

  if (sellerLoading || !selectedSellerOrder) {
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

  const orderItem = selectedSellerOrder;
  const order = orderItem.order;
  const product = orderItem.product;
  const buyer = order?.buyer;
  const shippingAddress = order?.shipping_address as ShippingAddress | undefined;
  const buyerName = buyer?.full_name || shippingAddress?.full_name || 'Customer';
  const buyerPhone = buyer?.phone || shippingAddress?.phone;
  const buyerEmail = buyer?.email;
  const orderStatus = orderItem.status as OrderStatus;
  const nextStatus = getNextStatus(orderStatus);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
              <Text style={[styles.orderLabel, { color: theme.textSecondary }]}>Order Item</Text>
              <Text style={[styles.orderId, { color: theme.text }]}>
                #{orderItem.id.slice(0, 8).toUpperCase()}
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
            Received on {formatOrderDate(orderItem.created_at)} at{' '}
            {formatOrderTime(orderItem.created_at)}
          </Text>
        </View>

        {/* Order Timeline */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Status</Text>
          <OrderStatusTimeline
            currentStatus={orderStatus}
            createdAt={orderItem.created_at}
            updatedAt={order?.updated_at}
          />
        </View>

        {/* Product Info */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color={PrimaryColors.blue} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Product</Text>
          </View>
          <View style={styles.productContainer}>
            <Image
              source={{ uri: product?.images?.[0] || 'https://via.placeholder.com/100' }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
                {product?.title}
              </Text>
              <View style={styles.productMeta}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Quantity:</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>{orderItem.quantity}</Text>
              </View>
              <View style={styles.productMeta}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Price:</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>
                  {formatPrice(Number(orderItem.price))} each
                </Text>
              </View>
              {orderItem.tracking_number && (
                <View style={[styles.trackingBadge, { backgroundColor: SemanticColors.infoBg }]}>
                  <Ionicons name="locate-outline" size={14} color={SemanticColors.info} />
                  <Text style={[styles.trackingText, { color: SemanticColors.info }]}>
                    {orderItem.tracking_number}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.earningsRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>
              Your Earnings
            </Text>
            <Text style={[styles.earningsValue, { color: PrimaryColors.blue }]}>
              {formatPrice(Number(orderItem.price) * orderItem.quantity)}
            </Text>
          </View>
        </View>

        {/* Buyer Information */}
        <View style={[styles.card, { backgroundColor: cardBackground }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={PrimaryColors.blue} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Buyer Information</Text>
          </View>
          <View style={styles.buyerContainer}>
            <View style={styles.buyerRow}>
              <Text style={[styles.buyerLabel, { color: theme.textSecondary }]}>Name:</Text>
              <Text style={[styles.buyerValue, { color: theme.text }]}>{buyerName}</Text>
            </View>
            <View style={styles.buyerRow}>
              <Text style={[styles.buyerLabel, { color: theme.textSecondary }]}>Phone:</Text>
              <Text style={[styles.buyerValue, { color: theme.text }]}>
                {buyerPhone || 'Not provided'}
              </Text>
            </View>
            <View style={styles.buyerRow}>
              <Text style={[styles.buyerLabel, { color: theme.textSecondary }]}>Email:</Text>
              <Text style={[styles.buyerValue, { color: theme.text }]}>
                {buyerEmail || 'Not provided'}
              </Text>
            </View>
          </View>
          {(buyerPhone || buyerEmail) && (
            <Pressable
              style={[styles.contactBuyerButton, { borderColor: PrimaryColors.blue }]}
              onPress={() => setShowContactModal(true)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={PrimaryColors.blue} />
              <Text style={[styles.contactBuyerText, { color: PrimaryColors.blue }]}>
                View Contact Info
              </Text>
            </Pressable>
          )}
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

        {/* Update Status Button */}
        {nextStatus && (
          <View style={styles.actionContainer}>
            <Button onPress={() => setShowUpdateModal(true)}>
              <View style={styles.buttonContent}>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  Mark as {getOrderStatusLabel(nextStatus)}
                </Text>
              </View>
            </Button>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Update Status Modal */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowUpdateModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: cardBackground }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Update Order Status</Text>

            <View style={styles.statusChangeRow}>
              <View style={styles.statusChangeItem}>
                <Text style={[styles.statusChangeLabel, { color: theme.textSecondary }]}>
                  Current
                </Text>
                <View
                  style={[
                    styles.statusChangeBadge,
                    { backgroundColor: getOrderStatusBgColor(orderStatus) },
                  ]}
                >
                  <Text style={{ color: getOrderStatusColor(orderStatus), fontWeight: '600' }}>
                    {getOrderStatusLabel(orderStatus)}
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={24} color={GrayColors[400]} />
              <View style={styles.statusChangeItem}>
                <Text style={[styles.statusChangeLabel, { color: theme.textSecondary }]}>New</Text>
                {nextStatus && (
                  <View
                    style={[
                      styles.statusChangeBadge,
                      { backgroundColor: getOrderStatusBgColor(nextStatus) },
                    ]}
                  >
                    <Text style={{ color: getOrderStatusColor(nextStatus), fontWeight: '600' }}>
                      {getOrderStatusLabel(nextStatus)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tracking Number Input (for shipped status) */}
            {nextStatus === 'shipped' && (
              <View style={styles.trackingInputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Tracking Number <Text style={{ color: SemanticColors.error }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.trackingInput,
                    {
                      backgroundColor: isDark ? theme.inputBackground : GrayColors[50],
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="Enter tracking number"
                  placeholderTextColor={theme.placeholder}
                />
                <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
                  Required before marking as shipped
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmButton,
                  { backgroundColor: PrimaryColors.blue },
                  updating && { opacity: 0.7 },
                ]}
                onPress={handleUpdateStatus}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Update</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Contact Buyer Modal */}
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
              Contact {buyerName}
            </Text>
            {buyerPhone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={20} color={PrimaryColors.blue} />
                <Text style={[styles.contactText, { color: theme.text }]}>{buyerPhone}</Text>
              </View>
            )}
            {buyerEmail && (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={20} color={PrimaryColors.blue} />
                <Text style={[styles.contactText, { color: theme.text }]}>{buyerEmail}</Text>
              </View>
            )}
            {!buyerPhone && !buyerEmail && (
              <Text style={[styles.noContact, { color: theme.textSecondary }]}>
                No contact information available
              </Text>
            )}
            <Pressable
              style={[styles.modalCloseButton, { backgroundColor: PrimaryColors.blue }]}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
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
  productContainer: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    backgroundColor: GrayColors[100],
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  productMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  metaLabel: {
    ...Typography.bodySmall,
  },
  metaValue: {
    ...Typography.bodySmall,
    fontWeight: '500',
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
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
  },
  earningsLabel: {
    ...Typography.body,
  },
  earningsValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  buyerContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  buyerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  buyerLabel: {
    ...Typography.bodySmall,
    width: 60,
  },
  buyerValue: {
    ...Typography.bodySmall,
    flex: 1,
    fontWeight: '500',
  },
  contactBuyerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  contactBuyerText: {
    ...Typography.body,
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
  actionContainer: {
    marginTop: Spacing.lg,
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
    maxWidth: 380,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  statusChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusChangeItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusChangeLabel: {
    ...Typography.caption,
  },
  statusChangeBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  trackingInputContainer: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  trackingInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  inputHint: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
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
  modalCloseButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalCloseButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
