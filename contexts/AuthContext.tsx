
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url: string | null;
  banner_url?: string | null;
  unique_profile_link?: string;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Register push notifications when user logs in
  usePushNotifications(user?.id || null);

  const ensureWalletExists = async (userId: string) => {
    try {
      const { data: existingWallet } = await supabase
        .from('wallet')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingWallet) {
        console.log('Creating wallet for user:', userId);
        const { error } = await supabase.from('wallet').insert({
          user_id: userId,
          balance: 0.00,
          last_updated: new Date().toISOString(),
        });

        if (error) {
          console.error('Error creating wallet:', error);
        } else {
          console.log('Wallet created successfully');
        }
      }
    } catch (error) {
      console.error('Error in ensureWalletExists:', error);
    }
  };

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        console.log('Profile not found, creating new profile for user:', userId);
        
        const username = userEmail ? userEmail.split('@')[0] : `user_${userId.substring(0, 8)}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username,
            display_name: username,
            avatar_url: null,
            unique_profile_link: `roastlive.com/@${username}`,
            followers_count: 0,
            following_count: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        console.log('Profile created successfully:', newProfile);
        
        await ensureWalletExists(userId);
        
        return newProfile;
      }

      console.log('Profile fetched successfully:', data);
      
      await ensureWalletExists(userId);
      
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.email);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).then(setProfile);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://natively.dev/email-confirmed',
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      const username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '') || email.split('@')[0];
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username,
        display_name: displayName,
        avatar_url: null,
        unique_profile_link: `roastlive.com/@${username}`,
        followers_count: 0,
        following_count: 0,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { error: profileError };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
