import { create } from 'zustand';
import {
  WishlistItemWithProduct,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistProductIds,
  clearWishlist,
} from '@/services/wishlist-service';

interface WishlistState {
  items: WishlistItemWithProduct[];
  productIdsArray: string[]; // Use array for proper reactivity
  loading: boolean;
  syncing: boolean;
  error: string | null;

  // Computed
  itemCount: number;

  // Actions
  fetchWishlist: (userId: string) => Promise<void>;
  addItem: (userId: string, productId: string) => Promise<boolean>;
  removeItem: (userId: string, productId: string) => Promise<boolean>;
  toggleItem: (userId: string, productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clear: (userId: string) => Promise<boolean>;
  fetchProductIds: (userId: string) => Promise<void>;

  // Local state updates
  _setLoading: (loading: boolean) => void;
  _setError: (error: string | null) => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  productIdsArray: [],
  loading: false,
  syncing: false,
  error: null,
  itemCount: 0,

  _setLoading: (loading) => set({ loading }),

  _setError: (error) => set({ error }),

  fetchWishlist: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await getWishlist(userId);

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      const items = data || [];
      const productIdsArray = items.map((item) => item.product_id);

      set({
        items,
        productIdsArray,
        itemCount: items.length,
        loading: false,
      });
    } catch (err) {
      set({ error: 'Failed to load wishlist', loading: false });
    }
  },

  fetchProductIds: async (userId: string) => {
    try {
      const { productIds: ids, error } = await getWishlistProductIds(userId);

      if (error) {
        console.error('Failed to fetch wishlist product IDs:', error);
        return;
      }

      set({
        productIdsArray: ids,
        itemCount: ids.length,
      });
    } catch (err) {
      console.error('Failed to fetch wishlist product IDs');
    }
  },

  addItem: async (userId: string, productId: string) => {
    const { productIdsArray, itemCount } = get();

    // Optimistic update - add to array
    const newProductIdsArray = [...productIdsArray, productId];
    set({ productIdsArray: newProductIdsArray, itemCount: itemCount + 1, syncing: true, error: null });

    try {
      const { error } = await addToWishlist(userId, productId);

      if (error) {
        // Rollback
        set({ productIdsArray, itemCount, error: error.message, syncing: false });
        return false;
      }

      set({ syncing: false });
      return true;
    } catch (err) {
      set({ productIdsArray, itemCount, error: 'Failed to add to wishlist', syncing: false });
      return false;
    }
  },

  removeItem: async (userId: string, productId: string) => {
    const { productIdsArray, items, itemCount } = get();

    // Optimistic update - remove from array
    const newProductIdsArray = productIdsArray.filter((id) => id !== productId);
    const newItems = items.filter((item) => item.product_id !== productId);

    set({
      productIdsArray: newProductIdsArray,
      items: newItems,
      itemCount: Math.max(0, itemCount - 1),
      syncing: true,
      error: null,
    });

    try {
      const { success, error } = await removeFromWishlist(userId, productId);

      if (!success || error) {
        // Rollback
        set({ productIdsArray, items, itemCount, error: error?.message || 'Failed to remove from wishlist', syncing: false });
        return false;
      }

      set({ syncing: false });
      return true;
    } catch (err) {
      set({ productIdsArray, items, itemCount, error: 'Failed to remove from wishlist', syncing: false });
      return false;
    }
  },

  toggleItem: async (userId: string, productId: string) => {
    const { productIdsArray } = get();
    const isCurrentlyInWishlist = productIdsArray.includes(productId);

    if (isCurrentlyInWishlist) {
      return get().removeItem(userId, productId);
    } else {
      return get().addItem(userId, productId);
    }
  },

  isInWishlist: (productId: string) => {
    return get().productIdsArray.includes(productId);
  },

  clear: async (userId: string) => {
    const { items, productIdsArray, itemCount } = get();

    set({
      items: [],
      productIdsArray: [],
      itemCount: 0,
      syncing: true,
      error: null,
    });

    try {
      const { success, error } = await clearWishlist(userId);

      if (!success || error) {
        // Rollback
        set({ items, productIdsArray, itemCount, error: error?.message || 'Failed to clear wishlist', syncing: false });
        return false;
      }

      set({ syncing: false });
      return true;
    } catch (err) {
      set({ items, productIdsArray, itemCount, error: 'Failed to clear wishlist', syncing: false });
      return false;
    }
  },
}));
