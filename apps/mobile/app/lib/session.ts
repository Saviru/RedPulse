import * as SecureStore from '../../src/utils/storage';

export type SessionRole = "user" | "hospital";

let cachedUser: { username: string; role: SessionRole } | null = null;

export const setSession = (token: string, user: { username: string; role: SessionRole }): void => {
  // We don't cache token in a variable to avoid stale sessions on logout/login
  SecureStore.setItemAsync('userToken', token);
  cachedUser = user;
};

export const clearSession = (): void => {
  SecureStore.deleteItemAsync('userToken');
  cachedUser = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('userToken');
};

export const getCachedUser = (): { username: string; role: SessionRole } | null => cachedUser;

export default function Ignore() { return null; }
