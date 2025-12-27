import { create } from 'zustand';
import { Category } from '@/types/database';
import {
  ProductWithDetails,
  ProductFilters,
  SortOption,
  getProducts,
  searchProducts,
  getProductById,
  getFeaturedProducts,
  getPopularProducts,
  getRecentProducts,
  getRelatedProducts,
  getAllCategories,
  getPriceRange,
} from '@/services/browse-service';

interface BrowseState {
  // Products
  products: ProductWithDetails[];
  featuredProducts: ProductWithDetails[];
  popularProducts: ProductWithDetails[];
  recentProducts: ProductWithDetails[];
  relatedProducts: ProductWithDetails[];
  selectedProduct: ProductWithDetails | null;

  // Categories
  categories: Category[];

  // Pagination
  currentPage: number;
  totalCount: number;
  hasMore: boolean;

  // Filters & Sort
  filters: ProductFilters;
  sortOption: SortOption;
  priceRange: { min: number; max: number };

  // View mode
  viewMode: 'grid' | 'list';

  // Loading states
  loading: boolean;
  loadingMore: boolean;
  homeLoading: boolean;
  searchLoading: boolean;

  // Search
  searchQuery: string;
  searchResults: ProductWithDetails[];

  // Error
  error: string | null;

  // Actions
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilters: (filters: ProductFilters) => void;
  setSortOption: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Data fetching
  fetchProducts: (reset?: boolean) => Promise<void>;
  fetchMoreProducts: () => Promise<void>;
  fetchHomeData: () => Promise<void>;
  fetchProduct: (productId: string) => Promise<void>;
  fetchRelatedProducts: (productId: string, categoryId: string | null) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchPriceRange: () => Promise<void>;
  performSearch: (query: string) => Promise<void>;

  // Clear
  clearSelectedProduct: () => void;
  clearSearchResults: () => void;
  clearError: () => void;
}

const ITEMS_PER_PAGE = 20;

export const useBrowseStore = create<BrowseState>((set, get) => ({
  // Initial State
  products: [],
  featuredProducts: [],
  popularProducts: [],
  recentProducts: [],
  relatedProducts: [],
  selectedProduct: null,
  categories: [],
  currentPage: 1,
  totalCount: 0,
  hasMore: true,
  filters: {},
  sortOption: 'newest',
  priceRange: { min: 0, max: 100000 },
  viewMode: 'grid',
  loading: false,
  loadingMore: false,
  homeLoading: false,
  searchLoading: false,
  searchQuery: '',
  searchResults: [],
  error: null,

  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),

  setFilters: (filters) => set({ filters }),

  setSortOption: (sort) => set({ sortOption: sort }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearFilters: () => set({
    filters: {},
    sortOption: 'newest',
    currentPage: 1,
    hasMore: true,
  }),

  // Fetch products with filters and sorting
  fetchProducts: async (reset = true) => {
    const { filters, sortOption } = get();

    if (reset) {
      set({ loading: true, currentPage: 1, error: null });
    }

    try {
      const { data, count, error } = await getProducts(
        filters,
        sortOption,
        { page: 1, limit: ITEMS_PER_PAGE }
      );

      if (error) throw error;

      set({
        products: data || [],
        totalCount: count,
        currentPage: 1,
        hasMore: (data?.length || 0) < count,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Fetch more products (pagination)
  fetchMoreProducts: async () => {
    const { products, filters, sortOption, currentPage, hasMore, loadingMore } = get();

    if (!hasMore || loadingMore) return;

    set({ loadingMore: true });

    try {
      const nextPage = currentPage + 1;
      const { data, error } = await getProducts(
        filters,
        sortOption,
        { page: nextPage, limit: ITEMS_PER_PAGE }
      );

      if (error) throw error;

      const newProducts = [...products, ...(data || [])];

      set({
        products: newProducts,
        currentPage: nextPage,
        hasMore: (data?.length || 0) === ITEMS_PER_PAGE,
        loadingMore: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loadingMore: false });
    }
  },

  // Fetch home screen data
  fetchHomeData: async () => {
    set({ homeLoading: true, error: null });

    try {
      const [featured, popular, recent, categories] = await Promise.all([
        getFeaturedProducts(8),
        getPopularProducts(8),
        getRecentProducts(8),
        getAllCategories(),
      ]);

      set({
        featuredProducts: featured.data || [],
        popularProducts: popular.data || [],
        recentProducts: recent.data || [],
        categories: categories.data || [],
        homeLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, homeLoading: false });
    }
  },

  // Fetch single product
  fetchProduct: async (productId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await getProductById(productId);

      if (error) throw error;

      set({ selectedProduct: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Fetch related products
  fetchRelatedProducts: async (productId: string, categoryId: string | null) => {
    try {
      const { data } = await getRelatedProducts(productId, categoryId, 6);
      set({ relatedProducts: data || [] });
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const { data, error } = await getAllCategories();
      if (error) throw error;
      set({ categories: data || [] });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  // Fetch price range
  fetchPriceRange: async () => {
    try {
      const { min, max } = await getPriceRange();
      set({ priceRange: { min, max } });
    } catch (error) {
      console.error('Failed to fetch price range:', error);
    }
  },

  // Perform search
  performSearch: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false });
      return;
    }

    set({ searchLoading: true, searchQuery: query });

    try {
      const { data, error } = await searchProducts(query);

      if (error) throw error;

      set({ searchResults: data || [], searchLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, searchLoading: false });
    }
  },

  // Clear actions
  clearSelectedProduct: () => set({ selectedProduct: null, relatedProducts: [] }),

  clearSearchResults: () => set({ searchResults: [], searchQuery: '' }),

  clearError: () => set({ error: null }),
}));
