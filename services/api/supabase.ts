import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Database} from '../../types/dbSchema';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Function to sign in anonymously
export const signInAnonymously = async () => {
  const {data: {session}, error} = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Error signing in anonymously:', error.message);
    return {session: null, error};
  }

  return {session, error: null};
};

// Function to get the current user
export const getCurrentUser = async () => {
  const {data: {user}} = await supabase.auth.getUser();
  return user;
};

// Function to check if user is signed in
export const isSignedIn = async () => {
  const {data: {session}} = await supabase.auth.getSession();
  return session !== null;
};
