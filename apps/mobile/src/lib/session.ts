import * as SecureStore from '../utils/storage';

export type SessionRole = "user" | "hospital" | "organization";

let cachedToken: string | null = null;
let cachedUser: { username: string; role: SessionRole } | null = null;
let isInitializing = false;

export const setSession = async (token: string, user: { username: string; role: SessionRole }): Promise<void> => {
  console.log(`Session: Persisting session for ${user.username}, token len: ${token.length}`);
  cachedToken = token;
  cachedUser = user;
  await SecureStore.setItemAsync('userToken', token);
};

export const setTokenOnly = (token: string | null) => {
  console.log(`Session: Manual cache update, token len: ${token?.length || 0}`);
  cachedToken = token;
};

export const clearSession = async (): Promise<void> => {
  console.log('Session: Clearing session and storage');
  cachedToken = null;
  cachedUser = null;
  await SecureStore.deleteItemAsync('userToken');
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedToken) return cachedToken;
  
  // Prevent concurrent storage reads
  if (isInitializing) {
    // If already reading, wait a bit and retry from cache
    await new Promise(resolve => setTimeout(resolve, 50));
    return cachedToken;
  }

  isInitializing = true;
  try {
    const storedToken = await SecureStore.getItemAsync('userToken');
    console.log(`Session: Storage read complete (found: ${!!storedToken})`);
    cachedToken = storedToken;
  } catch (err) {
    console.error('Session: Failed to read token from storage', err);
  } finally {
    isInitializing = false;
  }
  
  return cachedToken;
};

export const getCachedUser = (): { username: string; role: SessionRole } | null => cachedUser;

export default function Ignore() { return null; }
