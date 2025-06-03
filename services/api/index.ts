// Export all API services
export * from './supabase';
export * from './taxiGroups';
export * from './users'

// Initialize anonymous sign-in
import {isSignedIn, signInAnonymously} from './supabase';

// Function to ensure user is signed in
export const ensureSignedIn = async () => {
  const signedIn = await isSignedIn();
  if (!signedIn) {
    await signInAnonymously();
  }
  return true;
};
