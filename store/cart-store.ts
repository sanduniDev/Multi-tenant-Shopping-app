import { create } from 'zustand';
import {
  CartItemWithProduct,
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartTotals,
  validateCartItems,
} from '@/services/cart-service';

interface CartState {
  items: CartItemWithProduct[];
  loading: boolean;
  syncing: boolean;
  error: string | null;

  // Computed values
  itemCount: number;
  totalQuantity: number;
  subtotal: number;

  // Actions
  fetchCart: (userId: string) => Promise<void>;
  addItem: (userId: string, productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clear: (userId: string) => Promise<boolean>;
  validateCart: (userId: string) => Promise<{
    valid: boolean;
    unavailableItems: { cartItemId: string; productTitle: string; availableStock: number }[];
  }>;

  // Local state updates
  _updateTotals: () => void;
  _setLoading: (loading: boolean) => void;
  _setError: (error: string | null) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  syncing: false,
  error: null,
  itemCount: 0,
  totalQuantity: 0,
  subtotal: 0,

  _updateTotals: () => {
    const { items } = get();
    const totals = calculateCartTotals(items);
    set({
      itemCount: totals.itemCount,
      totalQuantity: totals.totalQuantity,
      subtotal: totals.subtotal,
    });
  },

  _setLoading: (loading) => set({ loading }),

  _setError: (error) => set({ error }),

  fetchCart: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await getCart(userId);

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      set({ items: data || [], loading: false });
      get()._updateTotals();
    } catch (err) {
      set({ error: 'Failed to load cart', loading: false });
    }
  },

  addItem: async (userId: string, productId: string, quantity = 1) => {
    set({ syncing: true, error: null });

    try {
      const { error } = await addToCart(userId, productId, quantity);

      if (error) {
        set({ error: error.message, syncing: false });
        return false;
      }

      // Refetch cart to get updated items with product details
      await get().fetchCart(userId);
      set({ syncing: false });
      return true;
    } catch (err) {
      set({ error: 'Failed to add item to cart', syncing: false });
      return false;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    const { items } = get();

    // Optimistic update
    const previousItems = [...items];
    const updatedItems = items.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item
    );

    set({ items: updatedItems, syncing: true, error: null });
    get()._updateTotals();

    try {
      const { error } = await updateCartItemQuantity(cartItemId, quantity);

      if (error) {
        // Rollback on error
        set({ items: previousItems, error: error.message, syncing: false });
        get()._updateTotals();
        return false;
      }

      // If quantity was 0, remove from local state
      if (quantity <= 0) {
        set({
          items: items.filter((item) => item.id !== cartItemId),
          syncing: false,
        });
        get()._updateTotals();
      } else {
        set({ syncing: false });
      }

      return true;
    } catch (err) {
      set({ items: previousItems, error: 'Failed to update quantity', syncing: false });
      get()._updateTotals();
      return false;
    }
  },

  removeItem: async (cartItemId: string) => {
    const { items } = get();

    // Optimistic update
    const previousItems = [...items];
    set({
      items: items.filter((item) => item.id !== cartItemId),
      syncing: true,
      error: null,
    });
    get()._updateTotals();

    try {
      const { error } = await removeFromCart(cartItemId);

      if (error) {
        // Rollback on error
        set({ items: previousItems, error: error.message, syncing: false });
        get()._updateTotals();
        return false;
      }

      set({ syncing: false });
      return true;
    } catch (err) {
      set({ items: previousItems, error: 'Failed to remove item', syncing: false });
      get()._updateTotals();
      return false;
    }
  },

  clear: async (userId: string) => {
    const { items } = get();
    const previousItems = [...items];

    set({ items: [], syncing: true, error: null });
    get()._updateTotals();

    try {
      const { success, error } = await clearCart(userId);

      if (!success || error) {
        set({ items: previousItems, error: error?.message || 'Failed to clear cart', syncing: false });
        get()._updateTotals();
        return false;
      }

      set({ syncing: false });
      return true;
    } catch (err) {
      set({ items: previousItems, error: 'Failed to clear cart', syncing: false });
      get()._updateTotals();
      return false;
    }
  },

  validateCart: async (userId: string) => {
    try {
      const result = await validateCartItems(userId);

      if (result.error) {
        set({ error: result.error.message });
        return { valid: false, unavailableItems: [] };
      }

      return {
        valid: result.valid,
        unavailableItems: result.unavailableItems,
      };
    } catch (err) {
      set({ error: 'Failed to validate cart' });
      return { valid: false, unavailableItems: [] };
    }
  },
}));
