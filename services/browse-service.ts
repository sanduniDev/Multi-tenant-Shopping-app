import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export type SortOption = 'newest' | 'price_low' | 'price_high' | 'popular' | 'rating';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductWithDetails extends Product {
  seller?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Get all active products with filters, sorting, and pagination
 */
export async function getProducts(
  filters?: ProductFilters,
  sort: SortOption = 'newest',
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ data: ProductWithDetails[] | null; count: number; error: Error | null }> {
  try {
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `, { count: 'exact' })
      .eq('is_active', true)
      .gt('inventory_count', 0);

    // Apply filters
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('review_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;
    return { data: data as ProductWithDetails[], count: count || 0, error: null };
  } catch (error) {
    console.error('Get products error:', error);
    return { data: null, count: 0, error: error as Error };
  }
}

/**
 * Search products
 */
export async function searchProducts(
  query: string,
  limit: number = 20
): Promise<{ data: ProductWithDetails[] | null; error: Error | null }> {
  try {
    if (!query.trim()) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `)
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .ilike('title', `%${query}%`)
      .order('review_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as ProductWithDetails[], error: null };
  } catch (error) {
    console.error('Search products error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  productId: string
): Promise<{ data: ProductWithDetails | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `)
      .eq('id', productId)
      .single();

    if (error) throw error;
    return { data: data as ProductWithDetails, error: null };
  } catch (error) {
    console.error('Get product by ID error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categoryId: string,
  sort: SortOption = 'newest',
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ data: ProductWithDetails[] | null; count: number; error: Error | null }> {
  return getProducts({ categoryId }, sort, pagination);
}

/**
 * Get featured products (highest rated)
 */
export async function getFeaturedProducts(
  limit: number = 10
): Promise<{ data: ProductWithDetails[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `)
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .order('average_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as ProductWithDetails[], error: null };
  } catch (error) {
    console.error('Get featured products error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get popular products (most reviewed)
 */
export async function getPopularProducts(
  limit: number = 10
): Promise<{ data: ProductWithDetails[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `)
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .order('review_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as ProductWithDetails[], error: null };
  } catch (error) {
    console.error('Get popular products error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get recently added products
 */
export async function getRecentProducts(
  limit: number = 10
): Promise<{ data: ProductWithDetails[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `)
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as ProductWithDetails[], error: null };
  } catch (error) {
    console.error('Get recent products error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get related products
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit: number = 6
): Promise<{ data: ProductWithDetails[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug)
      `)
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .neq('id', productId);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as ProductWithDetails[], error: null };
  } catch (error) {
    console.error('Get related products error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<{ data: Category[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data: data as Category[], error: null };
  } catch (error) {
    console.error('Get categories error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get price range for filter
 */
export async function getPriceRange(): Promise<{ min: number; max: number; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('price')
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .order('price', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { min: 0, max: 100000, error: null };
    }

    const prices = data.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
      error: null,
    };
  } catch (error) {
    console.error('Get price range error:', error);
    return { min: 0, max: 100000, error: error as Error };
  }
}
