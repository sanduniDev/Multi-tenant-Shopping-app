import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/auth';
import { uploadImageFromUri } from './storage-service';

interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

/**
 * Get profile by user ID
 */
export async function getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update profile
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileData
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data: profile as Profile, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Upload avatar and update profile
 */
export async function updateAvatar(
  userId: string,
  imageUri: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const fileName = `${userId}/${Date.now()}`;
    const { url, error: uploadError } = await uploadImageFromUri(
      imageUri,
      'avatars',
      fileName
    );

    if (uploadError || !url) {
      throw uploadError || new Error('Failed to upload avatar');
    }

    // Update profile with new avatar URL
    const { error: updateError } = await updateProfile(userId, {
      avatar_url: url,
    });

    if (updateError) {
      throw updateError;
    }

    return { url, error: null };
  } catch (error) {
    console.error('Update avatar error:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Add a new role for user
 */
export async function addUserRole(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        is_active: true,
      });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Add user role error:', error);
    return { error: error as Error };
  }
}

/**
 * Get user roles
 */
export async function getUserRoles(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Get user roles error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, role: 'buyer' | 'seller'): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
