import { Redirect } from 'expo-router';

export default function CheckoutIndex() {
  // Redirect to select address as the first step
  return <Redirect href="/checkout/select-address" />;
}
