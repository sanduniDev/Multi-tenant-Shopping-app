import { supabase } from '@/lib/supabase';
import { CartItem, Product } from '@/types/database';

export interface CartItemWithProduct extends CartItem {
  product: Product & {
    seller?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

/**
 * Get all cart items for a user
 */
export async function getCart(
  userId: string
): Promise<{ data: CartItemWithProduct[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cart_items')
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
    return { data: data as CartItemWithProduct[], error: null };
  } catch (error) {
    console.error('Get cart error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Add a product to cart
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<{ data: CartItem | null; error: Error | null }> {
  try {
    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    // If we got an unexpected error (not just "no rows"), surface it
    if (existingError) throw existingError;

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }

    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Add to cart error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<{ data: CartItem | null; error: Error | null }> {
  try {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update cart item error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  cartItemId: string
): Promise<{ data: CartItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Remove from cart error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Clear cart error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get cart item count
 */
export async function getCartItemCount(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Get cart count error:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Validate cart items (check stock availability)
 */
export async function validateCartItems(
  userId: string
): Promise<{
  valid: boolean;
  unavailableItems: { cartItemId: string; productTitle: string; availableStock: number }[];
  error: Error | null;
}> {
  try {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product:products(id, title, inventory_count, is_active)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const unavailableItems: { cartItemId: string; productTitle: string; availableStock: number }[] = [];

    for (const item of cartItems || []) {
      const product = item.product as any;
      if (!product.is_active || product.inventory_count < item.quantity) {
        unavailableItems.push({
          cartItemId: item.id,
          productTitle: product.title,
          availableStock: product.inventory_count || 0,
        });
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems,
      error: null,
    };
  } catch (error) {
    console.error('Validate cart error:', error);
    return { valid: false, unavailableItems: [], error: error as Error };
  }
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: CartItemWithProduct[]): {
  subtotal: number;
  itemCount: number;
  totalQuantity: number;
} {
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of items) {
    if (item.product) {
      subtotal += item.product.price * item.quantity;
      totalQuantity += item.quantity;
    }
  }

  return {
    subtotal,
    itemCount: items.length,
    totalQuantity,
  };
}
