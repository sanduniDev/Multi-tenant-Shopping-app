import { create } from 'zustand';
import { Address } from '@/types/database';
import {
  getAddresses,
  getDefaultAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  AddressInsert,
  AddressUpdate,
} from '@/services/address-service';

interface AddressState {
  addresses: Address[];
  defaultAddress: Address | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;

  // Actions
  fetchAddresses: (userId: string) => Promise<void>;
  fetchDefaultAddress: (userId: string) => Promise<void>;
  addNewAddress: (addressData: AddressInsert) => Promise<Address | null>;
  updateExistingAddress: (
    addressId: string,
    userId: string,
    addressData: AddressUpdate
  ) => Promise<boolean>;
  removeAddress: (addressId: string, userId: string) => Promise<boolean>;
  makeDefault: (addressId: string, userId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  defaultAddress: null,
  loading: false,
  syncing: false,
  error: null,

  fetchAddresses: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await getAddresses(userId);

      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      const addresses = data || [];
      const defaultAddr = addresses.find((a) => a.is_default) || null;

      set({
        addresses,
        defaultAddress: defaultAddr,
        loading: false,
      });
    } catch (err) {
      set({ error: 'Failed to load addresses', loading: false });
    }
  },

  fetchDefaultAddress: async (userId: string) => {
    try {
      const { data, error } = await getDefaultAddress(userId);

      if (error) {
        console.error('Fetch default address error:', error);
        return;
      }

      set({ defaultAddress: data });
    } catch (err) {
      console.error('Failed to fetch default address:', err);
    }
  },

  addNewAddress: async (addressData: AddressInsert) => {
    set({ syncing: true, error: null });

    try {
      const { data, error } = await addAddress(addressData);

      if (error) {
        set({ error: error.message, syncing: false });
        return null;
      }

      if (data) {
        const { addresses } = get();
        let updatedAddresses: Address[];

        // If new address is default, update other addresses
        if (data.is_default) {
          updatedAddresses = addresses.map((a) => ({
            ...a,
            is_default: false,
          }));
          updatedAddresses.unshift(data);
          set({
            addresses: updatedAddresses,
            defaultAddress: data,
            syncing: false,
          });
        } else {
          updatedAddresses = [data, ...addresses];
          set({ addresses: updatedAddresses, syncing: false });
        }
      }

      return data;
    } catch (err) {
      set({ error: 'Failed to add address', syncing: false });
      return null;
    }
  },

  updateExistingAddress: async (
    addressId: string,
    userId: string,
    addressData: AddressUpdate
  ) => {
    set({ syncing: true, error: null });

    try {
      const { data, error } = await updateAddress(addressId, userId, addressData);

      if (error) {
        set({ error: error.message, syncing: false });
        return false;
      }

      if (data) {
        const { addresses } = get();
        let updatedAddresses = addresses.map((a) =>
          a.id === addressId ? data : a
        );

        // If updated address is now default, update others
        if (data.is_default) {
          updatedAddresses = updatedAddresses.map((a) =>
            a.id !== addressId ? { ...a, is_default: false } : a
          );
          set({
            addresses: updatedAddresses,
            defaultAddress: data,
            syncing: false,
          });
        } else {
          // Check if we need to update default
          const currentDefault = updatedAddresses.find((a) => a.is_default);
          set({
            addresses: updatedAddresses,
            defaultAddress: currentDefault || null,
            syncing: false,
          });
        }
      }

      return true;
    } catch (err) {
      set({ error: 'Failed to update address', syncing: false });
      return false;
    }
  },

  removeAddress: async (addressId: string, userId: string) => {
    set({ syncing: true, error: null });

    const { addresses } = get();
    const previousAddresses = [...addresses];
    const addressToRemove = addresses.find((a) => a.id === addressId);

    // Optimistic update
    set({
      addresses: addresses.filter((a) => a.id !== addressId),
    });

    try {
      const { success, error } = await deleteAddress(addressId, userId);

      if (!success || error) {
        // Rollback on error
        set({
          addresses: previousAddresses,
          error: error?.message || 'Failed to delete address',
          syncing: false,
        });
        return false;
      }

      // Update default if needed
      const { addresses: updatedAddresses } = get();
      if (addressToRemove?.is_default && updatedAddresses.length > 0) {
        // Refetch to get the new default
        await get().fetchAddresses(userId);
      } else {
        const newDefault = updatedAddresses.find((a) => a.is_default) || null;
        set({ defaultAddress: newDefault, syncing: false });
      }

      return true;
    } catch (err) {
      set({
        addresses: previousAddresses,
        error: 'Failed to delete address',
        syncing: false,
      });
      return false;
    }
  },

  makeDefault: async (addressId: string, userId: string) => {
    set({ syncing: true, error: null });

    const { addresses } = get();
    const previousAddresses = [...addresses];

    // Optimistic update
    const updatedAddresses = addresses.map((a) => ({
      ...a,
      is_default: a.id === addressId,
    }));
    const newDefault = updatedAddresses.find((a) => a.id === addressId) || null;
    set({ addresses: updatedAddresses, defaultAddress: newDefault });

    try {
      const { success, error } = await setDefaultAddress(addressId, userId);

      if (!success || error) {
        // Rollback on error
        set({
          addresses: previousAddresses,
          defaultAddress: previousAddresses.find((a) => a.is_default) || null,
          error: error?.message || 'Failed to set default address',
          syncing: false,
        });
        return false;
      }

      set({ syncing: false });
      return true;
    } catch (err) {
      set({
        addresses: previousAddresses,
        defaultAddress: previousAddresses.find((a) => a.is_default) || null,
        error: 'Failed to set default address',
        syncing: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
