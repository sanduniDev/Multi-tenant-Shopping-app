import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRole, Profile, UserRoleData } from '@/types/auth';

interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  activeRole: UserRole | null;
  userRoles: UserRoleData[];
  loading: boolean;
  initialized: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setActiveRole: (role: UserRole) => void;
  setUserRoles: (roles: UserRoleData[]) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  fetchProfile: () => Promise<void>;
  fetchUserRoles: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  session: null,
  user: null,
  profile: null,
  activeRole: null,
  userRoles: [],
  loading: true,
  initialized: false,

  // Actions
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setProfile: (profile) => set({ profile }),

  setActiveRole: (role) => set({ activeRole: role }),

  setUserRoles: (roles) => set({ userRoles: roles }),

  initialize: async () => {
    try {
      set({ loading: true });

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        set({ session, user: session.user });

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Fetch user roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        const typedRoles = (roles || []) as UserRoleData[];

        set({
          profile: profile ? (profile as Profile) : null,
          userRoles: typedRoles,
          activeRole: typedRoles[0]?.role || null,
        });
      }

      set({ loading: false, initialized: true });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ loading: false });
        return { error };
      }

      if (data.session) {
        set({
          session: data.session,
          user: data.session.user,
        });

        // Fetch profile and roles after sign in
        await get().fetchProfile();
        await get().fetchUserRoles();
      }

      set({ loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      set({ loading: false });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });

      await supabase.auth.signOut();

      set({
        session: null,
        user: null,
        profile: null,
        activeRole: null,
        userRoles: [],
        loading: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      set({ loading: false });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      set({ profile: profile ? (profile as Profile) : null });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  fetchUserRoles: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const typedRoles = (roles || []) as UserRoleData[];

      set({
        userRoles: typedRoles,
        activeRole: typedRoles[0]?.role || null,
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  },
}));
