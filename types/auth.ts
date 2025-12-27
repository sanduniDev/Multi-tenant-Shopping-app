/**
 * Authentication related types for BazaarX
 */

export type UserRole = 'buyer' | 'seller';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}
