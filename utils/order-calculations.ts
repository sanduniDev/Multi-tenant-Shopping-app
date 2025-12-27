import { CartItemWithProduct } from '@/services/cart-service';
import { Coupon } from '@/types/database';

/**
 * Calculate subtotal from cart items
 */
export function calculateSubtotal(items: CartItemWithProduct[]): number {
  let subtotal = 0;

  for (const item of items) {
    if (item.product) {
      subtotal += item.product.price * item.quantity;
    }
  }

  return Math.round(subtotal * 100) / 100;
}

/**
 * Calculate total quantity of items in cart
 */
export function calculateTotalQuantity(items: CartItemWithProduct[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calculate shipping charges
 * Currently returns 0 as per user preference (no shipping for now)
 */
export function calculateShipping(_subtotal: number): number {
  // No shipping charges for now
  return 0;
}

/**
 * Calculate tax
 * Currently returns 0 (can be implemented later with tax rates)
 */
export function calculateTax(_subtotal: number): number {
  // No tax calculation for now
  return 0;
}

/**
 * Calculate discount from coupon
 */
export function calculateCouponDiscount(
  coupon: Coupon | null,
  subtotal: number
): number {
  if (!coupon) return 0;

  let discount = 0;

  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;
  } else if (coupon.discount_type === 'fixed') {
    discount = coupon.discount_value;
  }

  // Apply max discount limit if set
  if (coupon.max_discount_amount !== null && discount > coupon.max_discount_amount) {
    discount = coupon.max_discount_amount;
  }

  // Ensure discount doesn't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return Math.round(discount * 100) / 100;
}

/**
 * Calculate final order total
 */
export function calculateOrderTotal(
  subtotal: number,
  shipping: number,
  tax: number,
  discount: number
): number {
  const total = subtotal + shipping + tax - discount;
  return Math.max(0, Math.round(total * 100) / 100);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BZX-${timestamp}-${random}`;
}

/**
 * Get estimated delivery date (placeholder)
 */
export function getEstimatedDeliveryDate(daysToAdd: number = 5): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

/**
 * Format date for display
 */
export function formatDeliveryDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Group cart items by seller
 */
export function groupItemsBySeller(
  items: CartItemWithProduct[]
): Map<string, CartItemWithProduct[]> {
  const groups = new Map<string, CartItemWithProduct[]>();

  for (const item of items) {
    const sellerId = item.product?.seller_id || 'unknown';
    const existing = groups.get(sellerId) || [];
    existing.push(item);
    groups.set(sellerId, existing);
  }

  return groups;
}

/**
 * Calculate seller earnings from order items
 */
export function calculateSellerEarnings(
  items: CartItemWithProduct[],
  sellerId: string
): number {
  const sellerItems = items.filter((item) => item.product?.seller_id === sellerId);

  return sellerItems.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity;
  }, 0);
}
