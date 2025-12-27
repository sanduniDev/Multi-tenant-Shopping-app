import { supabase } from '@/lib/supabase';
import { Wishlist, Product } from '@/types/database';

export interface WishlistItemWithProduct extends Wishlist {
  product: Product & {
    seller?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

/**
 * Get all wishlist items for a user
 */
export async function getWishlist(
  userId: string
): Promise<{ data: WishlistItemWithProduct[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        product:products(
          *,
          seller:profiles!products_seller_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as WishlistItemWithProduct[], error: null };
  } catch (error) {
    console.error('Get wishlist error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Add a product to wishlist
 */
export async function addToWishlist(
  userId: string,
  productId: string
): Promise<{ data: Wishlist | null; error: Error | null }> {
  try {
    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      // Already in wishlist, return the existing item
      const { data } = await supabase
        .from('wishlists')
        .select('*')
        .eq('id', existing.id)
        .single();
      return { data, error: null };
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        product_id: productId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(
  userId: string,
  productId: string
): Promise<{ inWishlist: boolean; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      throw error;
    }

    return { inWishlist: !!data, error: null };
  } catch (error) {
    console.error('Check wishlist error:', error);
    return { inWishlist: false, error: error as Error };
  }
}

/**
 * Get wishlist count
 */
export async function getWishlistCount(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Get wishlist count error:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Toggle wishlist status
 */
export async function toggleWishlist(
  userId: string,
  productId: string
): Promise<{ inWishlist: boolean; error: Error | null }> {
  try {
    const { inWishlist } = await isInWishlist(userId, productId);

    if (inWishlist) {
      await removeFromWishlist(userId, productId);
      return { inWishlist: false, error: null };
    } else {
      await addToWishlist(userId, productId);
      return { inWishlist: true, error: null };
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return { inWishlist: false, error: error as Error };
  }
}

/**
 * Get wishlist product IDs for quick lookup
 */
export async function getWishlistProductIds(
  userId: string
): Promise<{ productIds: string[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);

    if (error) throw error;
    return {
      productIds: (data || []).map((item) => item.product_id),
      error: null,
    };
  } catch (error) {
    console.error('Get wishlist product IDs error:', error);
    return { productIds: [], error: error as Error };
  }
}

/**
 * Clear wishlist
 */
export async function clearWishlist(
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Clear wishlist error:', error);
    return { success: false, error: error as Error };
  }
}
