import { create } from 'zustand';
import { Address, Coupon } from '@/types/database';
import { CartItemWithProduct } from '@/services/cart-service';
import { validateCoupon, calculateDiscount } from '@/services/coupon-service';

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

interface CheckoutState {
  // Selected data
  selectedAddress: Address | null;
  appliedCoupon: Coupon | null;
  cartItems: CartItemWithProduct[];

  // Order summary
  orderSummary: OrderSummary;

  // Coupon state
  couponLoading: boolean;
  couponError: string | null;

  // General state
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedAddress: (address: Address | null) => void;
  setCartItems: (items: CartItemWithProduct[]) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  calculateOrderSummary: () => void;
  reset: () => void;

  // Getters
  isReadyForPayment: () => boolean;
}

const initialOrderSummary: OrderSummary = {
  subtotal: 0,
  shipping: 0, // No shipping for now
  tax: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  selectedAddress: null,
  appliedCoupon: null,
  cartItems: [],
  orderSummary: initialOrderSummary,
  couponLoading: false,
  couponError: null,
  loading: false,
  error: null,

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
  },

  setCartItems: (items) => {
    set({ cartItems: items });
    get().calculateOrderSummary();
  },

  applyCoupon: async (code: string) => {
    const { orderSummary } = get();

    set({ couponLoading: true, couponError: null });

    try {
      const result = await validateCoupon(code, orderSummary.subtotal);

      if (!result.valid || !result.coupon) {
        set({
          couponLoading: false,
          couponError: result.error || 'Invalid coupon',
        });
        return false;
      }

      set({
        appliedCoupon: result.coupon,
        couponLoading: false,
        couponError: null,
      });

      // Recalculate order summary with discount
      get().calculateOrderSummary();
      return true;
    } catch (err) {
      set({
        couponLoading: false,
        couponError: 'Failed to apply coupon',
      });
      return false;
    }
  },

  removeCoupon: () => {
    set({ appliedCoupon: null, couponError: null });
    get().calculateOrderSummary();
  },

  calculateOrderSummary: () => {
    const { cartItems, appliedCoupon } = get();

    // Calculate subtotal from cart items
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cartItems) {
      if (item.product) {
        subtotal += item.product.price * item.quantity;
        itemCount += item.quantity;
      }
    }

    // Calculate discount if coupon is applied
    let discount = 0;
    if (appliedCoupon) {
      discount = calculateDiscount(appliedCoupon, subtotal);
    }

    // Shipping (no shipping for now as per user preference)
    const shipping = 0;

    // Tax (none for now, can be added later)
    const tax = 0;

    // Calculate total
    const total = Math.max(0, subtotal + shipping + tax - discount);

    set({
      orderSummary: {
        subtotal: Math.round(subtotal * 100) / 100,
        shipping,
        tax,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100,
        itemCount,
      },
    });
  },

  reset: () => {
    set({
      selectedAddress: null,
      appliedCoupon: null,
      cartItems: [],
      orderSummary: initialOrderSummary,
      couponLoading: false,
      couponError: null,
      loading: false,
      error: null,
    });
  },

  isReadyForPayment: () => {
    const { selectedAddress, cartItems } = get();
    return selectedAddress !== null && cartItems.length > 0;
  },
}));
