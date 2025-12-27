import { create } from 'zustand';
import {
  OrderStatus,
  OrderWithItems,
  SellerOrderItem,
  getUserOrders,
  getOrder,
  getSellerOrders,
  getSellerOrderItem,
  getSellerOrderStats,
  cancelOrder as cancelOrderService,
  updateOrderItemStatus as updateOrderItemStatusService,
  reorder as reorderService,
} from '@/services/order-service';

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalEarnings: number;
}

interface OrderState {
  // Buyer state
  buyerOrders: OrderWithItems[];
  selectedOrder: OrderWithItems | null;
  buyerLoading: boolean;
  buyerError: string | null;

  // Seller state
  sellerOrders: SellerOrderItem[];
  selectedSellerOrder: SellerOrderItem | null;
  sellerLoading: boolean;
  sellerError: string | null;
  orderStats: OrderStats;

  // Filter state
  statusFilter: OrderStatus | 'all';

  // Buyer actions
  fetchBuyerOrders: (userId: string) => Promise<void>;
  fetchOrderDetails: (orderId: string, userId: string) => Promise<void>;
  cancelOrder: (orderId: string, userId: string) => Promise<boolean>;
  reorder: (orderId: string, userId: string) => Promise<{ success: boolean; itemsAdded: number; unavailable: string[] }>;
  clearSelectedOrder: () => void;

  // Seller actions
  fetchSellerOrders: (sellerId: string, status?: OrderStatus) => Promise<void>;
  fetchSellerOrderDetails: (orderItemId: string, sellerId: string) => Promise<void>;
  updateOrderItemStatus: (
    orderItemId: string,
    sellerId: string,
    newStatus: OrderStatus,
    trackingNumber?: string
  ) => Promise<boolean>;
  fetchOrderStats: (sellerId: string) => Promise<void>;
  clearSelectedSellerOrder: () => void;

  // Filter actions
  setStatusFilter: (status: OrderStatus | 'all') => void;

  // Reset
  reset: () => void;
}

const initialStats: OrderStats = {
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  totalEarnings: 0,
};

export const useOrderStore = create<OrderState>((set, get) => ({
  // Initial state
  buyerOrders: [],
  selectedOrder: null,
  buyerLoading: false,
  buyerError: null,

  sellerOrders: [],
  selectedSellerOrder: null,
  sellerLoading: false,
  sellerError: null,
  orderStats: initialStats,

  statusFilter: 'all',

  // Buyer actions
  fetchBuyerOrders: async (userId: string) => {
    set({ buyerLoading: true, buyerError: null });

    const { data, error } = await getUserOrders(userId);

    if (error) {
      set({ buyerLoading: false, buyerError: error.message });
      return;
    }

    set({ buyerOrders: data || [], buyerLoading: false });
  },

  fetchOrderDetails: async (orderId: string, userId: string) => {
    set({ buyerLoading: true, buyerError: null });

    const { data, error } = await getOrder(orderId, userId);

    if (error) {
      set({ buyerLoading: false, buyerError: error.message });
      return;
    }

    set({ selectedOrder: data, buyerLoading: false });
  },

  cancelOrder: async (orderId: string, userId: string) => {
    const { success, error } = await cancelOrderService(orderId, userId);

    if (!success) {
      set({ buyerError: error?.message || 'Failed to cancel order' });
      return false;
    }

    // Update the order in state
    const { buyerOrders, selectedOrder } = get();
    const updatedOrders = buyerOrders.map((order) =>
      order.id === orderId ? { ...order, status: 'cancelled' as OrderStatus } : order
    );

    set({
      buyerOrders: updatedOrders,
      selectedOrder:
        selectedOrder?.id === orderId
          ? { ...selectedOrder, status: 'cancelled' as OrderStatus }
          : selectedOrder,
    });

    return true;
  },

  reorder: async (orderId: string, userId: string) => {
    const result = await reorderService(orderId, userId);
    return {
      success: result.success,
      itemsAdded: result.itemsAdded,
      unavailable: result.unavailable,
    };
  },

  clearSelectedOrder: () => {
    set({ selectedOrder: null });
  },

  // Seller actions
  fetchSellerOrders: async (sellerId: string, status?: OrderStatus) => {
    set({ sellerLoading: true, sellerError: null });

    const { data, error } = await getSellerOrders(sellerId, status);

    if (error) {
      set({ sellerLoading: false, sellerError: error.message });
      return;
    }

    set({ sellerOrders: data || [], sellerLoading: false });
  },

  fetchSellerOrderDetails: async (orderItemId: string, sellerId: string) => {
    set({ sellerLoading: true, sellerError: null });

    const { data, error } = await getSellerOrderItem(orderItemId, sellerId);

    if (error) {
      set({ sellerLoading: false, sellerError: error.message });
      return;
    }

    set({ selectedSellerOrder: data, sellerLoading: false });
  },

  updateOrderItemStatus: async (
    orderItemId: string,
    sellerId: string,
    newStatus: OrderStatus,
    trackingNumber?: string
  ) => {
    const { success, error } = await updateOrderItemStatusService(
      orderItemId,
      sellerId,
      newStatus,
      trackingNumber
    );

    if (!success) {
      set({ sellerError: error?.message || 'Failed to update status' });
      return false;
    }

    // Update the order in state
    const { sellerOrders, selectedSellerOrder } = get();
    const updatedOrders = sellerOrders.map((item) =>
      item.id === orderItemId
        ? { ...item, status: newStatus, tracking_number: trackingNumber || item.tracking_number }
        : item
    );

    set({
      sellerOrders: updatedOrders,
      selectedSellerOrder:
        selectedSellerOrder?.id === orderItemId
          ? {
              ...selectedSellerOrder,
              status: newStatus,
              tracking_number: trackingNumber || selectedSellerOrder.tracking_number,
            }
          : selectedSellerOrder,
    });

    return true;
  },

  fetchOrderStats: async (sellerId: string) => {
    const stats = await getSellerOrderStats(sellerId);
    set({ orderStats: stats });
  },

  clearSelectedSellerOrder: () => {
    set({ selectedSellerOrder: null });
  },

  // Filter actions
  setStatusFilter: (status: OrderStatus | 'all') => {
    set({ statusFilter: status });
  },

  // Reset
  reset: () => {
    set({
      buyerOrders: [],
      selectedOrder: null,
      buyerLoading: false,
      buyerError: null,
      sellerOrders: [],
      selectedSellerOrder: null,
      sellerLoading: false,
      sellerError: null,
      orderStats: initialStats,
      statusFilter: 'all',
    });
  },
}));
