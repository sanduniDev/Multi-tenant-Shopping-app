/**
 * Database types for Supabase
 * Auto-generated types from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          city: string;
          country: string;
          created_at: string | null;
          full_name: string;
          id: string;
          is_default: boolean | null;
          phone: string;
          postal_code: string;
          state: string;
          user_id: string;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          city: string;
          country: string;
          created_at?: string | null;
          full_name: string;
          id?: string;
          is_default?: boolean | null;
          phone: string;
          postal_code: string;
          state: string;
          user_id: string;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          country?: string;
          created_at?: string | null;
          full_name?: string;
          id?: string;
          is_default?: boolean | null;
          phone?: string;
          postal_code?: string;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string;
          quantity: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id: string;
          quantity?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          buyer_id: string;
          created_at: string | null;
          id: string;
          last_message_at: string | null;
          product_id: string | null;
          seller_id: string;
        };
        Insert: {
          buyer_id: string;
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          product_id?: string | null;
          seller_id: string;
        };
        Update: {
          buyer_id?: string;
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          product_id?: string | null;
          seller_id?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean | null;
          max_discount_amount: number | null;
          min_purchase_amount: number | null;
          usage_limit: number | null;
          used_count: number | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean | null;
          max_discount_amount?: number | null;
          min_purchase_amount?: number | null;
          usage_limit?: number | null;
          used_count?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean | null;
          max_discount_amount?: number | null;
          min_purchase_amount?: number | null;
          usage_limit?: number | null;
          used_count?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          sender_id?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          id: string;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
          seller_id: string;
          status: string | null;
          tracking_number: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
          seller_id: string;
          status?: string | null;
          tracking_number?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          order_id?: string;
          price?: number;
          product_id?: string;
          quantity?: number;
          seller_id?: string;
          status?: string | null;
          tracking_number?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          buyer_id: string;
          created_at: string | null;
          id: string;
          payment_intent_id: string | null;
          shipping_address: Json | null;
          status: string | null;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          buyer_id: string;
          created_at?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          shipping_address?: Json | null;
          status?: string | null;
          total_amount: number;
          updated_at?: string | null;
        };
        Update: {
          buyer_id?: string;
          created_at?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          shipping_address?: Json | null;
          status?: string | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          average_rating: number | null;
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          images: string[] | null;
          inventory_count: number | null;
          is_active: boolean | null;
          price: number;
          review_count: number | null;
          seller_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          average_rating?: number | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          inventory_count?: number | null;
          is_active?: boolean | null;
          price: number;
          review_count?: number | null;
          seller_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          average_rating?: number | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          inventory_count?: number | null;
          is_active?: boolean | null;
          price?: number;
          review_count?: number | null;
          seller_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          buyer_id: string;
          comment: string | null;
          created_at: string | null;
          id: string;
          images: string[] | null;
          product_id: string;
          rating: number;
          updated_at: string | null;
        };
        Insert: {
          buyer_id: string;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          images?: string[] | null;
          product_id: string;
          rating: number;
          updated_at?: string | null;
        };
        Update: {
          buyer_id?: string;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          images?: string[] | null;
          product_id?: string;
          rating?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type exports
export type Address = Tables<'addresses'>;
export type CartItem = Tables<'cart_items'>;
export type Category = Tables<'categories'>;
export type Conversation = Tables<'conversations'>;
export type Coupon = Tables<'coupons'>;
export type Message = Tables<'messages'>;
export type OrderItem = Tables<'order_items'>;
export type Order = Tables<'orders'>;
export type Product = Tables<'products'>;
export type Profile = Tables<'profiles'>;
export type Review = Tables<'reviews'>;
export type UserRole = Tables<'user_roles'>;
export type Wishlist = Tables<'wishlists'>;
