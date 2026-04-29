import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initializing: boolean;
  signInCustomer: (username: string, password: string) => Promise<void>;
  signInAdmin: (username: string, password: string) => Promise<void>;
  signInCashier: (username: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signUpCustomer: (username: string, password: string, fullName: string) => Promise<void>;
  signUpAdmin: (username: string, email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const profileIdRef = useRef<string | null>(null);
  const isSigningInRef = useRef(false);

  const fetchProfile = async (userId: string, retries = 5): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data && retries > 0) {
        await new Promise(r => setTimeout(r, 300));
        return fetchProfile(userId, retries - 1);
      }

      setProfile(data);
      profileIdRef.current = data?.id ?? null;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setInitializing(false));
      } else {
        setLoading(false);
        setInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        const userId = session?.user?.id ?? null;
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && isSigningInRef.current) {
          // Sign-in function handles profile fetch; skip here to avoid race
          return;
        }

        if (userId) {
          if (profileIdRef.current !== userId) {
            setLoading(true);
            await fetchProfile(userId);
          }
        } else {
          setProfile(null);
          profileIdRef.current = null;
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInCustomer = async (username: string, password: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        throw new Error('Wrong username');
      }

      if (profileData.role !== 'customer') {
        throw new Error('Invalid credentials for customer login');
      }

      isSigningInRef.current = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      if (error) {
        isSigningInRef.current = false;
        throw new Error('Wrong password');
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
      isSigningInRef.current = false;
    } catch (error) {
      isSigningInRef.current = false;
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id);
    }
  };

  const signUpCustomer = async (username: string, password: string, fullName: string) => {
    const email = `${username}@customer.local`;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
          role: 'customer',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id);
    }
  };

  const signInAdmin = async (username: string, password: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        throw new Error('Wrong username');
      }

      if (profileData.role !== 'admin') {
        throw new Error('Invalid credentials for admin login');
      }

      isSigningInRef.current = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      if (error) {
        isSigningInRef.current = false;
        throw new Error('Wrong password');
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
      isSigningInRef.current = false;
    } catch (error) {
      isSigningInRef.current = false;
      throw error;
    }
  };

  const signInCashier = async (username: string, password: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name, username')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        throw new Error('Wrong username');
      }

      if (profileData.role !== 'cashier') {
        throw new Error('Invalid credentials for cashier login');
      }

      isSigningInRef.current = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      if (error) {
        isSigningInRef.current = false;
        throw new Error('Wrong password');
      }

      if (data.user) {
        await fetchProfile(data.user.id);

        await supabase.auth.getSession();

        const { error: logError } = await supabase.from('staff_logs').insert({
          admin_id: data.user.id,
          staff_name: profileData.full_name || username,
          admin_username: '',
          cashier_username: username,
          role: 'cashier',
        });

        if (logError) {
          console.error('Failed to log cashier login:', logError);
        }
      }
      isSigningInRef.current = false;
    } catch (error) {
      isSigningInRef.current = false;
      throw error;
    }
  };

  const signUpAdmin = async (username: string, email: string, password: string, fullName: string) => {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
          role: 'admin',
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    initializing,
    signInCustomer,
    signInAdmin,
    signInCashier,
    signUp,
    signUpCustomer,
    signUpAdmin,
    signOut,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
