/**
 * Mock Payment Service
 * Simulates payment processing without real Stripe integration
 * Replace with actual Stripe integration when ready
 */

export type PaymentMethod = 'card' | 'cash_on_delivery';

export interface PaymentDetails {
  method: PaymentMethod;
  // Card details (mock - never store real card data)
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardHolderName?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string | null;
  error: string | null;
  method: PaymentMethod;
}

export interface MockPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  createdAt: string;
}

/**
 * Creates a mock payment intent
 * In production, this would call a Supabase Edge Function to create a Stripe PaymentIntent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd'
): Promise<MockPaymentIntent> {
  // Simulate network delay
  await delay(500);

  const paymentIntent: MockPaymentIntent = {
    id: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    currency,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  return paymentIntent;
}

/**
 * Processes a mock payment
 * Simulates payment processing with configurable success/failure
 */
export async function processPayment(
  paymentDetails: PaymentDetails,
  amount: number
): Promise<PaymentResult> {
  // Simulate payment processing time
  await delay(1500);

  // Mock validation
  if (paymentDetails.method === 'card') {
    // Simulate card validation
    if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 16) {
      return {
        success: false,
        paymentId: null,
        error: 'Invalid card number',
        method: paymentDetails.method,
      };
    }

    // Test card numbers for different scenarios
    // 4242424242424242 - Success
    // 4000000000000002 - Decline
    // Any other valid 16-digit number - Success
    const cleanCardNumber = paymentDetails.cardNumber.replace(/\s/g, '');

    if (cleanCardNumber === '4000000000000002') {
      return {
        success: false,
        paymentId: null,
        error: 'Your card was declined. Please try a different card.',
        method: paymentDetails.method,
      };
    }

    if (cleanCardNumber === '4000000000009995') {
      return {
        success: false,
        paymentId: null,
        error: 'Insufficient funds. Please try a different card.',
        method: paymentDetails.method,
      };
    }
  }

  // Success case
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    paymentId,
    error: null,
    method: paymentDetails.method,
  };
}

/**
 * Validates card number using Luhn algorithm (basic validation)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\s/g, '');

  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validates card expiry date
 */
export function validateCardExpiry(expiry: string): boolean {
  // Expected format: MM/YY or MM/YYYY
  const match = expiry.match(/^(\d{2})\/(\d{2,4})$/);

  if (!match) {
    return false;
  }

  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);

  // Convert 2-digit year to 4-digit
  if (year < 100) {
    year += 2000;
  }

  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }

  // Check if not expired
  const now = new Date();
  const cardDate = new Date(year, month - 1, 1);
  cardDate.setMonth(cardDate.getMonth() + 1); // End of expiry month

  return cardDate > now;
}

/**
 * Validates CVC
 */
export function validateCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc);
}

/**
 * Formats card number with spaces for display
 */
export function formatCardNumber(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  const groups = cleanValue.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleanValue;
}

/**
 * Formats expiry date as MM/YY
 */
export function formatCardExpiry(value: string): string {
  const cleanValue = value.replace(/\D/g, '');

  if (cleanValue.length >= 2) {
    return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
  }

  return cleanValue;
}

/**
 * Gets card type from card number
 */
export function getCardType(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '');

  const patterns: { [key: string]: RegExp } = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^(?:2131|1800|35)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleanNumber)) {
      return type;
    }
  }

  return 'unknown';
}

/**
 * Helper function to simulate network delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock refund function
 * In production, this would call Stripe refund API
 */
export async function refundPayment(
  paymentId: string,
  amount?: number
): Promise<{ success: boolean; refundId: string | null; error: string | null }> {
  await delay(1000);

  // Always succeed for mock
  return {
    success: true,
    refundId: `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    error: null,
  };
}
