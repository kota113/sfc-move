import {ensureSignedIn} from './index';

// Initialize the API services
export const initializeApi = async () => {
  try {
    // Ensure the user is signed in anonymously
    await ensureSignedIn();
    console.log('API initialized, user signed in anonymously');
    return true;
  } catch (error) {
    console.error('Failed to initialize API:', error);
    return false;
  }
};

// Call this function as early as possible in the app lifecycle
