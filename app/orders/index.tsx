import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
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
import { useOrderStore } from '@/store/order-store';
import {
  OrderStatus,
  OrderWithItems,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderStatusBgColor,
  formatOrderDate,
} from '@/services/order-service';
import { formatPrice } from '@/services/product-service';
import { OrderStatusTimeline } from '@/components/ui/order-status-timeline';

type FilterStatus = OrderStatus | 'all';

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrderHistoryScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const { buyerOrders, buyerLoading, fetchBuyerOrders, statusFilter, setStatusFilter } =
    useOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const cardBackground = isDark ? theme.cardBackground : '#FFFFFF';

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchBuyerOrders(user.id);
      }
    }, [user?.id])
  );

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchBuyerOrders(user.id);
    setRefreshing(false);
  };

  const handleOrderPress = (order: OrderWithItems) => {
    router.push(`/orders/${order.id}`);
  };

  const getDerivedStatus = (order: OrderWithItems): OrderStatus => {
    const statuses = order.items.map((item) => item.status as OrderStatus);
    const allCancelled = statuses.length > 0 && statuses.every((s) => s === 'cancelled');
    if (allCancelled) return 'cancelled';
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('shipped')) return 'shipped';
    if (statuses.includes('delivered')) return 'delivered';
    return order.status as OrderStatus;
  };

  // Filter orders
  const filteredOrders = buyerOrders.filter((order) => {
    const derivedStatus = getDerivedStatus(order);
    // Status filter
    if (statusFilter !== 'all' && derivedStatus !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(query);
      const matchesProduct = order.items.some((item) =>
        item.product?.title?.toLowerCase().includes(query)
      );
      return matchesId || matchesProduct;
    }

    return true;
  });

  const renderOrderCard = ({ item: order }: { item: OrderWithItems }) => {
    const firstItem = order.items[0];
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const derivedStatus = getDerivedStatus(order);

    return (
      <Pressable
        style={[styles.orderCard, { backgroundColor: cardBackground }, Shadows.sm]}
        onPress={() => handleOrderPress(order)}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={[styles.orderIdLabel, { color: theme.textSecondary }]}>Order</Text>
            <Text style={[styles.orderId, { color: theme.text }]}>
              #{order.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getOrderStatusBgColor(derivedStatus) },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getOrderStatusColor(derivedStatus) }]}
            >
              {getOrderStatusLabel(derivedStatus)}
            </Text>
          </View>
        </View>

        {/* Compact Timeline */}
        <OrderStatusTimeline
          currentStatus={derivedStatus}
          createdAt={order.created_at}
          updatedAt={order.updated_at}
          compact
        />

        {/* Order Items Preview */}
        <View style={styles.itemsPreview}>
          <Image
            source={{ uri: firstItem?.product?.images?.[0] || 'https://via.placeholder.com/60' }}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text
              style={[styles.itemTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {firstItem?.product?.title || 'Product'}
            </Text>
            <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {order.items.length > 1 && ` from ${order.items.length} products`}
            </Text>
          </View>
          <View style={styles.orderTotal}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: theme.text }]}>
              {formatPrice(order.total_amount)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.orderFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
            Placed on {formatOrderDate(order.created_at)}
          </Text>
          <View style={styles.viewDetails}>
            <Text style={[styles.viewDetailsText, { color: PrimaryColors.blue }]}>
              View Details
            </Text>
            <Ionicons name="chevron-forward" size={16} color={PrimaryColors.blue} />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: GrayColors[100] }]}>
        <Ionicons name="receipt-outline" size={48} color={GrayColors[400]} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {statusFilter !== 'all'
          ? `You don't have any ${statusFilter} orders`
          : 'Start shopping to see your orders here'}
      </Text>
      <Pressable
        style={[styles.shopButton, { backgroundColor: PrimaryColors.blue }]}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Orders</Text>
        <View style={styles.headerRight} />
      </View>

      {buyerLoading && buyerOrders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading your orders...</Text>
        </View>
      ) : (
        <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark ? theme.inputBackground : '#FFFFFF',
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchTextInput, { color: theme.text }]}
            placeholder="Search by order ID or product"
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={GrayColors[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? PrimaryColors.blue : cardBackground,
                    borderColor: isActive ? PrimaryColors.blue : theme.border,
                  },
                ]}
                onPress={() => setStatusFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PrimaryColors.blue}
          />
        }
        ListEmptyComponent={!buyerLoading ? renderEmptyState : null}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
        </>
      )}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.xs,
  },
  filtersWrapper: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  orderCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderIdContainer: {
    gap: 2,
  },
  orderIdLabel: {
    ...Typography.caption,
  },
  orderId: {
    ...Typography.body,
    fontWeight: '600',
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
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: GrayColors[100],
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemMeta: {
    ...Typography.caption,
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...Typography.caption,
  },
  totalAmount: {
    ...Typography.body,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  orderDate: {
    ...Typography.caption,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['6xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  shopButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  shopButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
