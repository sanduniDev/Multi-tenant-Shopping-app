import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  ScrollView,
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
  SellerOrderItem,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderStatusBgColor,
  formatOrderDate,
  getNextStatus,
} from '@/services/order-service';
import { formatPrice } from '@/services/product-service';

type FilterStatus = OrderStatus | 'all';

const STATUS_TABS: { key: FilterStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'list-outline' },
  { key: 'pending', label: 'New', icon: 'time-outline' },
  { key: 'processing', label: 'Processing', icon: 'cube-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'airplane-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

export default function SellerOrdersScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const {
    sellerOrders,
    sellerLoading,
    orderStats,
    fetchSellerOrders,
    fetchOrderStats,
  } = useOrderStore();

  const [sellerStatusFilter, setSellerStatusFilter] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const cardBackground = isDark ? theme.cardBackground : '#FFFFFF';

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchSellerOrders(user.id, sellerStatusFilter === 'all' ? undefined : sellerStatusFilter);
        fetchOrderStats(user.id);
      }
    }, [user?.id, sellerStatusFilter])
  );

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchSellerOrders(user.id, sellerStatusFilter === 'all' ? undefined : sellerStatusFilter);
    await fetchOrderStats(user.id);
    setRefreshing(false);
  };

  const handleTabChange = (status: FilterStatus) => {
    setSellerStatusFilter(status);
  };

  const handleOrderPress = (orderItem: SellerOrderItem) => {
    router.push(`/seller-orders/${orderItem.id}`);
  };

  const getTabCount = (status: FilterStatus): number => {
    if (status === 'all') return orderStats.total;
    return orderStats[status] || 0;
  };

  const renderOrderCard = ({ item }: { item: SellerOrderItem }) => {
    const orderStatus = item.status as OrderStatus;
    const nextStatus = getNextStatus(orderStatus);
    const buyer = item.order?.buyer;

    return (
      <Pressable
        style={[styles.orderCard, { backgroundColor: cardBackground }, Shadows.sm]}
        onPress={() => handleOrderPress(item)}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={[styles.orderLabel, { color: theme.textSecondary }]}>Order Item</Text>
            <Text style={[styles.orderId, { color: theme.text }]}>
              #{item.id.slice(0, 8).toUpperCase()}
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

        {/* Product Info */}
        <View style={styles.productRow}>
          <Image
            source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/60' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
              {item.product?.title}
            </Text>
            <Text style={[styles.productMeta, { color: theme.textSecondary }]}>
              Qty: {item.quantity} × {formatPrice(Number(item.price))}
            </Text>
          </View>
          <View style={styles.earningsContainer}>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>Earnings</Text>
            <Text style={[styles.earningsValue, { color: PrimaryColors.blue }]}>
              {formatPrice(Number(item.price) * item.quantity)}
            </Text>
          </View>
        </View>

        {/* Buyer Info */}
        {buyer && (
          <View style={[styles.buyerRow, { borderTopColor: theme.border }]}>
            <View style={styles.buyerInfo}>
              <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.buyerName, { color: theme.text }]}>
                {buyer.full_name || 'Customer'}
              </Text>
            </View>
            <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
              {formatOrderDate(item.created_at)}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {nextStatus && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: PrimaryColors.blue }]}
              onPress={(e) => {
                e.stopPropagation();
                handleOrderPress(item);
              }}
            >
              <Text style={styles.actionButtonText}>
                Mark as {getOrderStatusLabel(nextStatus)}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          )}
          <Pressable
            style={[styles.viewButton, { borderColor: theme.border }]}
            onPress={() => handleOrderPress(item)}
          >
            <Text style={[styles.viewButtonText, { color: theme.text }]}>View Details</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: GrayColors[100] }]}>
        <Ionicons name="bag-handle-outline" size={48} color={GrayColors[400]} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {sellerStatusFilter === 'all' ? 'No orders yet' : `No ${sellerStatusFilter} orders`}
      </Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {sellerStatusFilter === 'all'
          ? 'When customers place orders, they will appear here'
          : `You don't have any ${sellerStatusFilter} orders at the moment`}
      </Text>
    </View>
  );

  // Stats summary
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: cardBackground }, Shadows.sm]}>
        <Text style={[styles.statValue, { color: PrimaryColors.blue }]}>{orderStats.total}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Orders</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: cardBackground }, Shadows.sm]}>
        <Text style={[styles.statValue, { color: theme.text }]}>
          {formatPrice(orderStats.totalEarnings)}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Earnings</Text>
      </View>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order Management</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Status Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = sellerStatusFilter === tab.key;
            const count = getTabCount(tab.key);
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? PrimaryColors.blue : cardBackground,
                    borderColor: isActive ? PrimaryColors.blue : theme.border,
                  },
                ]}
                onPress={() => handleTabChange(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? '#FFFFFF' : theme.textSecondary}
                />
                <Text
                  style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : theme.text }]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : GrayColors[200],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: isActive ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={sellerOrders}
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
        ListEmptyComponent={!sellerLoading ? renderEmptyState : null}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
  },
  tabsWrapper: {
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  tabLabel: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  tabBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 4,
  },
  tabBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
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
    marginBottom: Spacing.md,
  },
  orderIdContainer: {
    gap: 2,
  },
  orderLabel: {
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: GrayColors[100],
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  productMeta: {
    ...Typography.caption,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    ...Typography.caption,
  },
  earningsValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buyerName: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  orderDate: {
    ...Typography.caption,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  viewButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
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
  },
});
