import { create } from 'zustand';
import { Product, Category } from '@/types/database';
import {
  getSellerProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getCategories,
  getSellerStats,
  CreateProductData,
  UpdateProductData,
} from '@/services/product-service';

interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalOrders: number;
  pendingOrders: number;
  totalEarnings: number;
}

interface ProductState {
  // State
  products: Product[];
  categories: Category[];
  selectedProduct: Product | null;
  stats: SellerStats | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;

  // Filter state
  statusFilter: 'all' | 'active' | 'inactive' | 'out_of_stock';
  categoryFilter?: string;
  searchQuery: string;

  // Actions
  setStatusFilter: (filter: 'all' | 'active' | 'inactive' | 'out_of_stock') => void;
  setCategoryFilter: (categoryId?: string) => void;
  setSearchQuery: (query: string) => void;
  fetchProducts: (sellerId: string) => Promise<void>;
  fetchProduct: (productId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStats: (sellerId: string) => Promise<void>;
  addProduct: (sellerId: string, data: CreateProductData) => Promise<{ success: boolean; error?: string }>;
  editProduct: (productId: string, sellerId: string, data: UpdateProductData) => Promise<{ success: boolean; error?: string }>;
  removeProduct: (productId: string, sellerId: string) => Promise<{ success: boolean; error?: string }>;
  toggleStatus: (productId: string, sellerId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  clearSelectedProduct: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  // Initial State
  products: [],
  categories: [],
  selectedProduct: null,
  stats: null,
  loading: false,
  statsLoading: false,
  error: null,
  statusFilter: 'all',
  categoryFilter: undefined,
  searchQuery: '',

  // Actions
  setStatusFilter: (filter) => set({ statusFilter: filter }),

  setCategoryFilter: (categoryId) => set({ categoryFilter: categoryId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchProducts: async (sellerId: string) => {
    set({ loading: true, error: null });
    try {
      const { statusFilter, searchQuery, categoryFilter } = get();
      const { data, error } = await getSellerProducts(sellerId, {
        status: statusFilter,
        search: searchQuery || undefined,
        categoryId: categoryFilter,
      });

      if (error) throw error;
      set({ products: data || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchProduct: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await getProduct(productId);
      if (error) throw error;
      set({ selectedProduct: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await getCategories();
      if (error) throw error;
      set({ categories: data || [] });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  fetchStats: async (sellerId: string) => {
    set({ statsLoading: true });
    try {
      const { data, error } = await getSellerStats(sellerId);
      if (error) throw error;
      set({ stats: data, statsLoading: false });
    } catch (error) {
      set({ statsLoading: false });
      console.error('Failed to fetch stats:', error);
    }
  },

  addProduct: async (sellerId: string, data: CreateProductData) => {
    set({ loading: true, error: null });
    try {
      const { data: product, error } = await createProduct(sellerId, data);
      if (error) throw error;

      // Add to products list
      set((state) => ({
        products: [product!, ...state.products],
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return { success: false, error: (error as Error).message };
    }
  },

  editProduct: async (productId: string, sellerId: string, data: UpdateProductData) => {
    set({ loading: true, error: null });
    try {
      const { data: product, error } = await updateProduct(productId, sellerId, data);
      if (error) throw error;

      // Update in products list
      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? product! : p)),
        selectedProduct: product,
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return { success: false, error: (error as Error).message };
    }
  },

  removeProduct: async (productId: string, sellerId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await deleteProduct(productId, sellerId);
      if (error) throw error;

      // Remove from products list
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return { success: false, error: (error as Error).message };
    }
  },

  toggleStatus: async (productId: string, sellerId: string, isActive: boolean) => {
    try {
      const { error } = await toggleProductStatus(productId, sellerId, isActive);
      if (error) throw error;

      // Update in products list
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, is_active: isActive } : p
        ),
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  clearError: () => set({ error: null }),

  clearSelectedProduct: () => set({ selectedProduct: null }),
}));
