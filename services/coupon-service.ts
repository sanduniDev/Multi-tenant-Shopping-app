import { supabase } from '@/lib/supabase';
import { Coupon } from '@/types/database';

export interface CouponValidationResult {
  valid: boolean;
  coupon: Coupon | null;
  error: string | null;
  discount: number;
}

/**
 * Get coupon by code
 */
export async function getCouponByCode(
  code: string
): Promise<{ data: Coupon | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get coupon error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<CouponValidationResult> {
  try {
    const { data: coupon, error } = await getCouponByCode(code);

    if (error) {
      return {
        valid: false,
        coupon: null,
        error: 'Unable to validate coupon',
        discount: 0,
      };
    }

    if (!coupon) {
      return {
        valid: false,
        coupon: null,
        error: 'Invalid coupon code',
        discount: 0,
      };
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return {
        valid: false,
        coupon: null,
        error: 'This coupon is no longer active',
        discount: 0,
      };
    }

    // Check validity dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return {
        valid: false,
        coupon: null,
        error: 'This coupon is not yet valid',
        discount: 0,
      };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return {
        valid: false,
        coupon: null,
        error: 'This coupon has expired',
        discount: 0,
      };
    }

    // Check usage limit
    if (
      coupon.usage_limit !== null &&
      coupon.used_count !== null &&
      coupon.used_count >= coupon.usage_limit
    ) {
      return {
        valid: false,
        coupon: null,
        error: 'This coupon has reached its usage limit',
        discount: 0,
      };
    }

    // Check minimum purchase amount
    if (
      coupon.min_purchase_amount !== null &&
      cartTotal < coupon.min_purchase_amount
    ) {
      return {
        valid: false,
        coupon: null,
        error: `Minimum purchase of $${coupon.min_purchase_amount.toFixed(2)} required`,
        discount: 0,
      };
    }

    // Calculate discount
    const discount = calculateDiscount(coupon, cartTotal);

    return {
      valid: true,
      coupon,
      error: null,
      discount,
    };
  } catch (error) {
    console.error('Validate coupon error:', error);
    return {
      valid: false,
      coupon: null,
      error: 'Unable to validate coupon',
      discount: 0,
    };
  }
}

/**
 * Calculate discount amount based on coupon type
 */
export function calculateDiscount(coupon: Coupon, subtotal: number): number {
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

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

/**
 * Increment coupon usage count (call after successful order)
 */
export async function incrementCouponUsage(
  couponId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.rpc('increment_coupon_usage', {
      coupon_id: couponId,
    });

    // If RPC doesn't exist, use direct update
    if (error && error.message.includes('function')) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();

      if (coupon) {
        const { error: updateError } = await supabase
          .from('coupons')
          .update({ used_count: (coupon.used_count || 0) + 1 })
          .eq('id', couponId);

        if (updateError) throw updateError;
      }
    } else if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Increment coupon usage error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Format coupon for display
 */
export function formatCouponDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% off`;
  }
  return `$${coupon.discount_value.toFixed(2)} off`;
}

/**
 * Get coupon description for display
 */
export function getCouponDescription(coupon: Coupon): string {
  let desc = formatCouponDiscount(coupon);

  if (coupon.min_purchase_amount) {
    desc += ` on orders over $${coupon.min_purchase_amount.toFixed(2)}`;
  }

  if (coupon.max_discount_amount && coupon.discount_type === 'percentage') {
    desc += ` (max $${coupon.max_discount_amount.toFixed(2)})`;
  }

  return desc;
}
