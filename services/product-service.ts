import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import { uploadImageFromUri, deleteFile } from './storage-service';

const MAX_IMAGES = 3;

export interface CreateProductData {
  title: string;
  description?: string;
  price: number;
  category_id?: string;
  inventory_count: number;
  images?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  is_active?: boolean;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<{ data: Category[] | null; error: Error | null }> {
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
 * Get products for a seller
 */
export async function getSellerProducts(
  sellerId: string,
  options?: {
    status?: 'all' | 'active' | 'inactive' | 'out_of_stock';
    search?: string;
    categoryId?: string;
  }
): Promise<{ data: Product[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (options?.status === 'active') {
      query = query.eq('is_active', true).gt('inventory_count', 0);
    } else if (options?.status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (options?.status === 'out_of_stock') {
      query = query.eq('inventory_count', 0);
    }

    if (options?.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as Product[], error: null };
  } catch (error) {
    console.error('Get seller products error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string): Promise<{ data: Product | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return { data: data as Product, error: null };
  } catch (error) {
    console.error('Get product error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  sellerId: string,
  productData: CreateProductData
): Promise<{ data: Product | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        seller_id: sellerId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        category_id: productData.category_id,
        inventory_count: productData.inventory_count,
        images: productData.images || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Product, error: null };
  } catch (error) {
    console.error('Create product error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  sellerId: string,
  productData: UpdateProductData
): Promise<{ data: Product | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('seller_id', sellerId) // Ensure seller owns the product
      .select()
      .single();

    if (error) throw error;
    return { data: data as Product, error: null };
  } catch (error) {
    console.error('Update product error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(
  productId: string,
  sellerId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', sellerId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete product error:', error);
    return { error: error as Error };
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(
  productId: string,
  sellerId: string,
  isActive: boolean
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('seller_id', sellerId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Toggle product status error:', error);
    return { error: error as Error };
  }
}

/**
 * Upload product images
 */
export async function uploadProductImages(
  sellerId: string,
  imageUris: string[]
): Promise<{ urls: string[]; errors: Error[] }> {
  const urls: string[] = [];
  const errors: Error[] = [];

  // Limit to MAX_IMAGES
  const limitedUris = imageUris.slice(0, MAX_IMAGES);

  for (const uri of limitedUris) {
    const fileName = `${sellerId}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const { url, error } = await uploadImageFromUri(uri, 'products', fileName);

    if (error) {
      errors.push(error);
    } else if (url) {
      urls.push(url);
    }
  }

  return { urls, errors };
}

/**
 * Get seller dashboard statistics
 */
export async function getSellerStats(sellerId: string): Promise<{
  data: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    totalOrders: number;
    pendingOrders: number;
    totalEarnings: number;
  } | null;
  error: Error | null;
}> {
  try {
    // Get product counts
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, is_active, inventory_count')
      .eq('seller_id', sellerId);

    if (productsError) throw productsError;

    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter(p => p.is_active && p.inventory_count > 0).length || 0;
    const outOfStock = products?.filter(p => p.inventory_count === 0).length || 0;

    // Get order stats
    const { data: orderItems, error: ordersError } = await supabase
      .from('order_items')
      .select('id, price, quantity, status')
      .eq('seller_id', sellerId);

    if (ordersError) throw ordersError;

    const totalOrders = orderItems?.length || 0;
    const pendingOrders = orderItems?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
    const totalEarnings = orderItems?.reduce((sum, item) => {
      if (item.status === 'delivered') {
        return sum + (item.price * item.quantity);
      }
      return sum;
    }, 0) || 0;

    return {
      data: {
        totalProducts,
        activeProducts,
        outOfStock,
        totalOrders,
        pendingOrders,
        totalEarnings,
      },
      error: null,
    };
  } catch (error) {
    console.error('Get seller stats error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Format price in LKR
 */
export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
