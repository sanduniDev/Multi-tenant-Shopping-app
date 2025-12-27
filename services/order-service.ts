import { supabase } from '@/lib/supabase';
import { Order, OrderItem, Address, Product } from '@/types/database';
import { CartItemWithProduct } from './cart-service';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product & {
    seller?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(
  userId: string
): Promise<{ data: Address[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get addresses error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Add a new address
 */
export async function addAddress(
  userId: string,
  address: Omit<Address, 'id' | 'user_id' | 'created_at'>
): Promise<{ data: Address | null; error: Error | null }> {
  try {
    // If this is the first address or marked as default, update others
    if (address.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...address,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Add address error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an address
 */
export async function updateAddress(
  addressId: string,
  userId: string,
  updates: Partial<Address>
): Promise<{ data: Address | null; error: Error | null }> {
  try {
    // If setting as default, update others first
    if (updates.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update address error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Delete address error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Create an order from cart items
 */
export async function createOrder(
  userId: string,
  cartItems: CartItemWithProduct[],
  shippingAddress: ShippingAddress,
  totalAmount: number,
  paymentIntentId?: string
): Promise<{ data: Order | null; error: Error | null }> {
  try {
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: 'pending',
        payment_intent_id: paymentIntentId || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      seller_id: item.product.seller_id,
      quantity: item.quantity,
      price: item.product.price,
      status: 'pending',
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update product inventory
    for (const item of cartItems) {
      const newInventory = Math.max(0, (item.product.inventory_count || 0) - item.quantity);
      await supabase
        .from('products')
        .update({ inventory_count: newInventory })
        .eq('id', item.product_id);
    }

    // Clear the cart
    await supabase.from('cart_items').delete().eq('user_id', userId);

    return { data: order, error: null };
  } catch (error) {
    console.error('Create order error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get orders for a user (as buyer)
 */
export async function getUserOrders(
  userId: string
): Promise<{ data: OrderWithItems[] | null; error: Error | null }> {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch order items for each order
    const ordersWithItems: OrderWithItems[] = [];

    for (const order of orders || []) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(
            *,
            seller:profiles!products_seller_id_fkey(id, full_name, avatar_url)
          )
        `)
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      ordersWithItems.push({
        ...order,
        items: items as OrderItemWithProduct[],
      });
    }

    return { data: ordersWithItems, error: null };
  } catch (error) {
    console.error('Get user orders error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(
  orderId: string,
  userId: string
): Promise<{ data: OrderWithItems | null; error: Error | null }> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('buyer_id', userId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(
          *,
          seller:profiles!products_seller_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return {
      data: {
        ...order,
        items: items as OrderItemWithProduct[],
      },
      error: null,
    };
  } catch (error) {
    console.error('Get order error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Cancel an order (only if pending)
 */
export async function cancelOrder(
  orderId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // First check if order is cancellable
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('buyer_id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (order.status !== 'pending') {
      throw new Error('Only pending orders can be cancelled');
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Update all order items status
    await supabase
      .from('order_items')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId);

    // Restore inventory
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    for (const item of items || []) {
      const { data: product } = await supabase
        .from('products')
        .select('inventory_count')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ inventory_count: (product.inventory_count || 0) + item.quantity })
          .eq('id', item.product_id);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Cancel order error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get order status label
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: '#F59E0B',
    processing: '#3B82F6',
    shipped: '#8B5CF6',
    delivered: '#10B981',
    cancelled: '#EF4444',
  };
  return colors[status] || '#6B7280';
}

/**
 * Get status background color (lighter shade for badges)
 */
export function getOrderStatusBgColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: '#FFFBEB',
    processing: '#EFF6FF',
    shipped: '#F5F3FF',
    delivered: '#ECFDF5',
    cancelled: '#FEF2F2',
  };
  return colors[status] || '#F3F4F6';
}

/**
 * Get next allowed status in the sequential flow
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const flow: Record<OrderStatus, OrderStatus | null> = {
    pending: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
    delivered: null,
    cancelled: null,
  };
  return flow[currentStatus];
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'pending' || status === 'processing';
}

// ============================================
// SELLER ORDER FUNCTIONS
// ============================================

export interface SellerOrderItem extends OrderItem {
  product: Product;
  order: Order & {
    buyer?: {
      id: string;
      full_name: string | null;
      email: string;
      phone: string | null;
    };
  };
}

/**
 * Get orders for a seller (order items containing their products)
 */
export async function getSellerOrders(
  sellerId: string,
  status?: OrderStatus
): Promise<{ data: SellerOrderItem[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('order_items')
      .select(`
        *,
        product:products(*),
        order:orders(
          *,
          buyer:profiles!orders_buyer_id_profiles_fkey(id, full_name, email, phone)
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as SellerOrderItem[], error: null };
  } catch (error) {
    console.error('Get seller orders error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single order item for seller
 */
export async function getSellerOrderItem(
  orderItemId: string,
  sellerId: string
): Promise<{ data: SellerOrderItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(*),
        order:orders(
          *,
          buyer:profiles!orders_buyer_id_profiles_fkey(id, full_name, email, phone)
        )
      `)
      .eq('id', orderItemId)
      .eq('seller_id', sellerId)
      .single();

    if (error) throw error;
    return { data: data as SellerOrderItem, error: null };
  } catch (error) {
    console.error('Get seller order item error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update order item status (seller only, sequential flow)
 */
export async function updateOrderItemStatus(
  orderItemId: string,
  sellerId: string,
  newStatus: OrderStatus,
  trackingNumber?: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // First verify ownership and get current status
    const { data: item, error: fetchError } = await supabase
      .from('order_items')
      .select('status')
      .eq('id', orderItemId)
      .eq('seller_id', sellerId)
      .single();

    if (fetchError) throw fetchError;

    const currentStatus = item.status as OrderStatus;
    const expectedNext = getNextStatus(currentStatus);

    // Validate sequential flow
    if (expectedNext !== newStatus) {
      throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}. Expected: ${expectedNext}`);
    }

    // Update the status
    const updateData: { status: OrderStatus; tracking_number?: string } = { status: newStatus };
    if (trackingNumber && newStatus === 'shipped') {
      updateData.tracking_number = trackingNumber;
    }

    const { error: updateError } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', orderItemId)
      .eq('seller_id', sellerId);

    if (updateError) throw updateError;

    // Check if all items in the order have the same status, then update order status
    const { data: orderItem } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('id', orderItemId)
      .single();

    if (orderItem) {
      const { data: allItems } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', orderItem.order_id);

      if (allItems && allItems.every((i) => i.status === newStatus)) {
        await supabase
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderItem.order_id);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Update order item status error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get seller order statistics
 */
export async function getSellerOrderStats(
  sellerId: string
): Promise<{
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalEarnings: number;
}> {
  try {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('status, price, quantity')
      .eq('seller_id', sellerId);

    if (error || !items) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalEarnings: 0,
      };
    }

    const stats = {
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      processing: items.filter((i) => i.status === 'processing').length,
      shipped: items.filter((i) => i.status === 'shipped').length,
      delivered: items.filter((i) => i.status === 'delivered').length,
      cancelled: items.filter((i) => i.status === 'cancelled').length,
      totalEarnings: items
        .filter((i) => i.status === 'delivered')
        .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
    };

    return stats;
  } catch (error) {
    console.error('Get seller order stats error:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalEarnings: 0,
    };
  }
}

/**
 * Reorder - add items from a previous order to cart
 */
export async function reorder(
  orderId: string,
  userId: string
): Promise<{ success: boolean; itemsAdded: number; unavailable: string[]; error: Error | null }> {
  try {
    // Get order items
    const { data: items, error: fetchError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        product:products(id, title, is_active, inventory_count)
      `)
      .eq('order_id', orderId);

    if (fetchError) throw fetchError;

    const unavailable: string[] = [];
    let itemsAdded = 0;

    for (const item of items || []) {
      const product = item.product as unknown as Product;

      // Check if product is available
      if (!product.is_active || (product.inventory_count || 0) < 1) {
        unavailable.push(product.title);
        continue;
      }

      // Check if item already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', item.product_id)
        .single();

      if (existing) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({
            quantity: existing.quantity + item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Add to cart
        await supabase.from('cart_items').insert({
          user_id: userId,
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }
      itemsAdded++;
    }

    return { success: true, itemsAdded, unavailable, error: null };
  } catch (error) {
    console.error('Reorder error:', error);
    return { success: false, itemsAdded: 0, unavailable: [], error: error as Error };
  }
}

/**
 * Format order date for display
 */
export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format order time for display
 */
export function formatOrderTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
