import React, { createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { AuthUser } from '../lib/authApi';
import { useAuth } from '../../src/context/AuthContext';

interface UserContextProps {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading, refreshUser: authRefreshUser, updateProfile } = useAuth();

  // Map AuthContext user to app-specific AuthUser interface
  const mappedUser = useMemo(() => {
    if (!authUser) return null;
    
    return {
      username: authUser.username,
      email: authUser.email,
      role: authUser.role.toLowerCase() as any,
      fullName: authUser.fullName,
      displayName: authUser.fullName || (authUser as any).displayName || (authUser as any).hospitalName || (authUser as any).organizationName,
      phone: authUser.phone,
      bloodGroup: authUser.bloodGroup,
      dob: authUser.dob,
      hospitalName: (authUser as any).hospitalName || (authUser as any).organizationName,
      city: (authUser as any).city || (authUser as any).location,
      address: (authUser as any).address || (authUser as any).location,
      totalDonations: (authUser as any).totalDonations || 0,
      lastDonationDate: authUser.lastDonationDate,
      points: (authUser as any).points || 0,
    } as AuthUser;
  }, [authUser]);

  const refreshUser = useCallback(async () => {
    await authRefreshUser();
  }, [authRefreshUser]);

  const setUser = useCallback((user: AuthUser | null) => {
    // This is primarily for manual overrides, which aren't common in the new flow
    // but we'll keep the function signature for compatibility.
    console.warn("Manual setUser called in UserContext. This should be handled by AuthContext.");
  }, []);

  return (
    <UserContext.Provider
      value={{ 
        user: mappedUser, 
        loading: isLoading, 
        error: null, 
        refreshUser, 
        setUser 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserStore() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserStore must be used within a UserProvider');
  }
  return context;
}

export default function Ignore() { return null; }
