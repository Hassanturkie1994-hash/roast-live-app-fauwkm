
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
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

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Use maybeSingle() instead of single() to handle missing profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // If profile doesn't exist, auto-create one
      if (!data) {
        console.log('Profile not found, creating new profile for user:', userId);
        
        // Use email as username if available, otherwise use a default
        const username = userEmail ? userEmail.split('@')[0] : `user_${userId.substring(0, 8)}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username,
            avatar_url: null,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        console.log('Profile created successfully:', newProfile);
        return newProfile;
      }

      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.email);
      setProfile(profileData);
    }
  };

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
  }, []);

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
      // Create profile with username from displayName or email
      const username = displayName || email.split('@')[0];
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username,
        avatar_url: null,
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
