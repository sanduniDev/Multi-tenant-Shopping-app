import { supabase } from '@/lib/supabase';
import { Address, InsertTables, UpdateTables } from '@/types/database';

export type AddressInsert = InsertTables<'addresses'>;
export type AddressUpdate = UpdateTables<'addresses'>;

/**
 * Get all addresses for a user
 */
export async function getAddresses(
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
 * Get a single address by ID
 */
export async function getAddressById(
  addressId: string
): Promise<{ data: Address | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get address error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get default address for a user
 */
export async function getDefaultAddress(
  userId: string
): Promise<{ data: Address | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get default address error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Add a new address
 */
export async function addAddress(
  addressData: AddressInsert
): Promise<{ data: Address | null; error: Error | null }> {
  try {
    // If this is set as default, unset any existing default first
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', addressData.user_id)
        .eq('is_default', true);
    }

    // If this is the first address, make it default
    const { count } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', addressData.user_id);

    const isFirstAddress = count === 0;

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...addressData,
        is_default: addressData.is_default || isFirstAddress,
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
 * Update an existing address
 */
export async function updateAddress(
  addressId: string,
  userId: string,
  addressData: AddressUpdate
): Promise<{ data: Address | null; error: Error | null }> {
  try {
    // If setting this as default, unset any existing default first
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', addressId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
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
    // Check if this is the default address
    const { data: address } = await supabase
      .from('addresses')
      .select('is_default')
      .eq('id', addressId)
      .single();

    const wasDefault = address?.is_default;

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw error;

    // If we deleted the default, set the most recent remaining address as default
    if (wasDefault) {
      const { data: remainingAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (remainingAddresses && remainingAddresses.length > 0) {
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remainingAddresses[0].id);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Delete address error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Unset current default
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // Set new default
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Set default address error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: Address): string {
  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format address as multiline for display
 */
export function formatAddressMultiline(address: Address): string[] {
  const lines = [
    address.full_name,
    address.address_line1,
    address.address_line2,
    `${address.city}, ${address.state} ${address.postal_code}`,
    address.country,
    address.phone,
  ].filter(Boolean) as string[];

  return lines;
}

/**
 * Validate address fields
 */
export function validateAddress(address: Partial<AddressInsert>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!address.full_name?.trim()) {
    errors.full_name = 'Full name is required';
  }

  if (!address.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[\d\s\-+()]{10,}$/.test(address.phone.trim())) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!address.address_line1?.trim()) {
    errors.address_line1 = 'Address is required';
  }

  if (!address.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!address.state?.trim()) {
    errors.state = 'State is required';
  }

  if (!address.postal_code?.trim()) {
    errors.postal_code = 'Postal code is required';
  }

  if (!address.country?.trim()) {
    errors.country = 'Country is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
